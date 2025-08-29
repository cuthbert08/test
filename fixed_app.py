
import os
import json
from flask import Flask, jsonify, request
from upstash_redis import Redis
from datetime import datetime, date, timedelta
import uuid
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

# --- INITIALIZATION ---

app = Flask(__name__)
CORS(app)

# Initialize Redis Client
redis = Redis.from_env()

JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-super-secret-key-for-testing')

# --- MOCK SENDING FUNCTIONS (Replace with your actual implementations) ---
def send_whatsapp_template_message(recipient_number, user_name, campaign_name, template_params):
    print(f"[MOCK WHATSAPP] To: {recipient_number}, Campaign: {campaign_name}, Params: {template_params}")
    # In a real scenario, you would handle potential errors from the API
    return {"status": "success"}

def send_sms_message(recipient_number, body):
    print(f"[MOCK SMS] To: {recipient_number}, Body: {body}")
    return {"status": "success"}

def send_email_message(recipient_email, subject, html_body):
    print(f"[MOCK EMAIL] To: {recipient_email}, Subject: {subject}")
    # print(f"Body: {html_body}") # Uncomment for debugging
    return {"status": "success"}


# --- SECURITY & AUTHENTICATION ---

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        if not token: return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            admins_json = redis.get('admins')
            admins = json.loads(admins_json) if admins_json else []
            current_user = next((admin for admin in admins if admin['id'] == data['id']), None)
            if not current_user: return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user['role'] not in roles:
                return jsonify({'message': 'Permission denied!'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/auth/login', methods=['POST'])
def login():
    auth = request.get_json()
    if not auth or not auth.get('email') or not auth.get('password'):
        return jsonify({'message': 'Could not verify'}), 401
    admins_json = redis.get('admins')
    admins = json.loads(admins_json) if admins_json else []
    user = next((admin for admin in admins if admin['email'] == auth['email']), None)
    if not user or not check_password_hash(user['password_hash'], auth['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    token = jwt.encode({'id': user['id'], 'exp': datetime.utcnow() + timedelta(hours=24)}, JWT_SECRET_KEY, "HS256")
    return jsonify({'token': token, 'user': {'id': user['id'], 'email': user['email'], 'role': user['role']}})


# --- HELPER FUNCTIONS ---
def add_communication_history(event_type, subject, details, status):
    """
    Adds a comprehensive communication history entry.
    `details` should be a list of dictionaries, each with 'recipient', 'method', 'status', and 'content'.
    """
    history_json = redis.get('communication_history')
    history = json.loads(history_json) if history_json else []
    
    new_entry = {
        "id": str(uuid.uuid4()),
        "type": event_type,
        "subject": subject,
        "timestamp": datetime.utcnow().isoformat(),
        "status": status, # "Completed", "Partial", "Failed"
        "details": details
    }
    history.insert(0, new_entry)
    redis.set('communication_history', json.dumps(history))


def add_log_entry(user_email, action_description):
    """Adds a log entry as a formatted string to the database."""
    logs_json = redis.get('logs')
    logs = json.loads(logs_json) if logs_json else []
    
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    new_entry = f"[{timestamp}] ({user_email}) {action_description}"
    
    logs.insert(0, new_entry)
    if len(logs) > 100:
        logs = logs[:100]
        
    redis.set('logs', json.dumps(logs))

def _advance_turn_in_db():
    flats_json = redis.get('flats')
    flats = json.loads(flats_json) if flats_json else []
    if len(flats) > 1:
        person_on_duty = flats.pop(0)
        flats.append(person_on_duty)
        redis.set('flats', json.dumps(flats))
        return True, f"Advanced turn. {person_on_duty.get('name')} moved to the end."
    return False, "Not enough residents to rotate."


def generate_text_message(template, resident, settings, subject=None):
    first_name = resident.get("name", "").split(" ")[0]
    flat_number = resident.get("flat_number", "")
    owner_name = settings.get('owner_name', 'Admin')
    owner_number = settings.get('owner_contact_whatsapp', '') # Use whatsapp number for consistency
    report_link = settings.get('report_issue_link', '#')

    personalized_body = template.replace("{first_name}", first_name).replace("{flat_number}", flat_number)
    
    footer = f"\n\nReport an issue: {report_link}\nContact {owner_name} at {owner_number}."
    
    if subject:
        return f"Announcement: {subject}\n{personalized_body}{footer}"
    else:
        return f"{personalized_body}{footer}"

def generate_html_message(template, resident, settings, subject="Bin Duty Reminder"):
    first_name = resident.get("name", "").split(" ")[0]
    flat_number = resident.get("flat_number", "")
    owner_name = settings.get('owner_name', 'Admin')
    owner_contact = settings.get('owner_contact_whatsapp', '') # Use whatsapp for consistency
    report_link = settings.get('report_issue_link', '#')

    personalized_body = template.replace("{first_name}", first_name).replace("{flat_number}", flat_number).replace('\n', '<br>')
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
            body {{ font-family: 'Poppins', sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e8e8e8; }}
            .header {{ background-color: #4A90E2; color: #ffffff; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; line-height: 1.7; color: #555; }}
            .content p {{ margin: 0 0 15px 0; }}
            .button-container {{ text-align: center; margin-top: 25px; }}
            .button {{ display: inline-block; padding: 12px 25px; background-color: #50C878; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; }}
            .footer {{ padding: 20px; font-size: 12px; color: #888; text-align: center; background-color: #f9f9f9; border-top: 1px solid #e8e8e8; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>{subject}</h1></div>
            <div class="content">
                <p>Hi {first_name},</p>
                <p>{personalized_body}</p>
                <div class="button-container"><a href="{report_link}" class="button">Report an Issue</a></div>
            </div>
            <div class="footer"><p>This is an automated message. For urgent enquiries, please contact {owner_name} at {owner_contact}.</p></div>
        </div>
    </body>
    </html>
    """
    return html

def generate_owner_issue_email(issue, settings):
    base_url = settings.get('report_issue_link', 'http://localhost:9002').rsplit('/report', 1)[0]
    issues_link = f"{base_url}/issues"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"><title>New Maintenance Issue</title>
        <style>
             @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
            body {{ font-family: 'Poppins', sans-serif; background-color: #f9fafb; color: #374151; margin: 0; padding: 20px; }}
            .container {{ max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }}
            .header {{ background-color: #FF5A5F; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; font-weight: 600; }}
            .content {{ padding: 32px; color: #4b5563; }}
            .content h2 {{ font-size: 20px; color: #111827; margin-top: 0; margin-bottom: 20px; }}
            .content p {{ margin: 0 0 10px; line-height: 1.6; }}
            .details-box {{ background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 20px; }}
            .details-box strong {{ color: #111827; }}
            .button-container {{ text-align: center; margin-top: 30px; margin-bottom: 10px; }}
            .button {{ display: inline-block; padding: 14px 28px; background-color: #3B82F6; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; }}
            .footer {{ padding: 24px; font-size: 13px; color: #9ca3af; text-align: center; background-color: #f9fafb; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>New Issue Reported</h1></div>
            <div class="content">
                <h2>A new maintenance issue has been submitted.</h2>
                <p>Details:</p>
                <div class="details-box">
                    <p><strong>Reported By:</strong> {issue['reported_by']}</p>
                    <p><strong>Flat Number:</strong> {issue['flat_number']}</p>
                    <p><strong>Description:</strong></p>
                    <p>{issue['description']}</p>
                </div>
                <div class="button-container"><a href="{issues_link}" class="button">View All Issues</a></div>
            </div>
            <div class="footer"><p>From your Bin Reminder App.</p></div>
        </div>
    </body>
    </html>
    """
    return html

# --- PUBLIC ROUTES ---
@app.route('/api/issues/public', methods=['GET'])
def get_public_issues():
    issues_json = redis.get('issues')
    issues = json.loads(issues_json) if issues_json else []
    return jsonify(issues)

@app.route('/api/issues', methods=['POST'])
def report_issue():
    data = request.get_json()
    issues_json = redis.get('issues')
    issues = json.loads(issues_json) if issues_json else []
    
    new_issue = {
        "id": str(uuid.uuid4()),
        "reported_by": data.get("name"),
        "flat_number": data.get("flat_number"),
        "description": data.get("description"),
        "status": "Reported",
        "timestamp": datetime.utcnow().isoformat()
    }
    issues.insert(0, new_issue)
    redis.set('issues', json.dumps(issues))
    
    settings_json = redis.get('settings')
    settings = json.loads(settings_json) if settings_json else {}
    owner_whatsapp = settings.get('owner_contact_whatsapp')
    owner_sms = settings.get('owner_contact_number')
    owner_email = settings.get('owner_contact_email')
    owner_name = settings.get('owner_name', 'Owner')

    base_url = settings.get('report_issue_link', 'http://localhost:9002').rsplit('/report', 1)[0]
    issues_link = f"{base_url}/issues"
    
    whatsapp_notification = f"New Issue Reported by {new_issue['reported_by']}, Flat {new_issue['flat_number']}: {new_issue['description'][:80]}... See it here: {issues_link}"
    sms_notification = f"New Issue Reported by {new_issue['reported_by']}, Flat {new_issue['flat_number']}. Desc: {new_issue['description']}"
    html_notification = generate_owner_issue_email(new_issue, settings)

    details = []
    if owner_whatsapp:
        res = send_whatsapp_template_message(owner_whatsapp, owner_name, os.getenv("AISENSY_ANNOUNCEMENT_CAMPAIGN_NAME", "issue_alert"), [f"New Issue from {new_issue['reported_by']}", owner_name, new_issue['description']])
        details.append({'recipient': owner_name, 'method': 'WhatsApp', 'status': 'Sent' if res.get('status') == 'success' else 'Failed', 'content': whatsapp_notification})
    if owner_sms:
        res = send_sms_message(owner_sms, sms_notification)
        details.append({'recipient': owner_name, 'method': 'SMS', 'status': 'Sent' if res.get('status') == 'success' else 'Failed', 'content': sms_notification})
    if owner_email:
        res = send_email_message(owner_email, "New Maintenance Issue Reported", html_notification)
        details.append({'recipient': owner_name, 'method': 'Email', 'status': 'Sent' if res.get('status') == 'success' else 'Failed', 'content': f"Subject: New Maintenance Issue Reported"})
    
    if details:
      add_communication_history("Issue Notification", "New Maintenance Issue", details, "Completed")
    
    add_log_entry("Public", f"Issue Reported by {new_issue['reported_by']}: {new_issue['description'][:50]}...")
    return jsonify({"message": "Issue reported successfully."}), 201

# --- PROTECTED ROUTES ---

@app.route('/api/dashboard')
@token_required
def get_dashboard_info(current_user):
    try:
        flats_json = redis.get('flats')
        flats = json.loads(flats_json) if flats_json else []
        last_run_date = redis.get('last_reminder_date') or "N/A"
        reminders_paused = json.loads(redis.get('reminders_paused') or 'false')

        current_person = flats[0] if flats else {"name": "N/A"}
        next_person = flats[1] if len(flats) > 1 else {"name": "N/A"}

        dashboard_data = {
            "current_duty": {"name": current_person.get("name")},
            "next_in_rotation": {"name": next_person.get("name")},
            "system_status": {"last_reminder_run": last_run_date, "reminders_paused": reminders_paused}
        }
        return jsonify(dashboard_data)
    except Exception as e:
        add_log_entry(current_user['email'], f"Error fetching dashboard: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/residents', methods=['GET', 'POST'])
@token_required
def handle_residents(current_user):
    if request.method == 'GET':
        flats_json = redis.get('flats')
        return jsonify(json.loads(flats_json) if flats_json else [])
    
    if request.method == 'POST':
        @role_required(['superuser', 'editor'])
        def add(current_user):
            data = request.get_json()
            flats_json = redis.get('flats')
            flats = json.loads(flats_json) if flats_json else []
            new_resident = {
                "id": str(uuid.uuid4()),
                "name": data.get("name"),
                "flat_number": data.get("flat_number"),
                "contact": data.get("contact", {}),
                "notes": data.get("notes", "")
            }
            flats.append(new_resident)
            redis.set('flats', json.dumps(flats))
            add_log_entry(current_user['email'], f"Resident Added: {new_resident['name']}")
            return jsonify(new_resident), 201
        return add(current_user)

@app.route('/api/residents/order', methods=['PUT'])
@token_required
@role_required(['superuser', 'editor'])
def update_residents_order(current_user):
    data = request.get_json()
    new_order = data.get('residents')
    if new_order is None: return jsonify({'error': 'No residents data provided'}), 400
    redis.set('flats', json.dumps(new_order))
    add_log_entry(current_user['email'], 'Resident duty order updated')
    return jsonify({'message': 'Resident order updated successfully'})


@app.route('/api/residents/<resident_id>', methods=['PUT', 'DELETE'])
@token_required
def handle_specific_resident(current_user, resident_id):
    flats_json = redis.get('flats')
    flats = json.loads(flats_json) if flats_json else []
    
    if request.method == 'PUT':
        @role_required(['superuser', 'editor'])
        def update(current_user):
            data = request.get_json()
            for i, flat in enumerate(flats):
                if flat.get("id") == resident_id:
                    flats[i].update(data)
                    redis.set('flats', json.dumps(flats))
                    add_log_entry(current_user['email'], f"Resident Updated: {flats[i]['name']}")
                    return jsonify({"message": "Resident updated successfully"})
            return jsonify({"error": "Resident not found"}), 404
        return update(current_user)

    if request.method == 'DELETE':
        @role_required(['superuser'])
        def delete(current_user):
            resident_name = next((f['name'] for f in flats if f.get("id") == resident_id), "Unknown")
            updated_flats = [f for f in flats if f.get("id") != resident_id]
            if len(updated_flats) == len(flats): return jsonify({"error": "Resident not found"}), 404
            redis.set('flats', json.dumps(updated_flats))
            add_log_entry(current_user['email'], f"Resident Deleted: {resident_name}")
            return "", 204
        return delete(current_user)

@app.route('/api/issues', methods=['GET', 'DELETE'])
@token_required
def handle_issues(current_user):
    if request.method == 'GET':
        issues_json = redis.get('issues')
        return jsonify(json.loads(issues_json) if issues_json else [])
    
    if request.method == 'DELETE':
        @role_required(['superuser'])
        def delete(current_user):
            ids_to_delete = set(request.get_json().get('ids', []))
            issues_json = redis.get('issues')
            issues = json.loads(issues_json) if issues_json else []
            updated_issues = [i for i in issues if i.get('id') not in ids_to_delete]
            redis.set('issues', json.dumps(updated_issues))
            add_log_entry(current_user['email'], f"Deleted {len(issues) - len(updated_issues)} issue(s)")
            return jsonify({'message': 'Issues deleted successfully'})
        return delete(current_user)

@app.route('/api/issues/<issue_id>', methods=['PUT'])
@token_required
@role_required(['superuser', 'editor'])
def update_issue(current_user, issue_id):
    new_status = request.get_json().get('status')
    issues_json = redis.get('issues')
    issues = json.loads(issues_json) if issues_json else []
    for issue in issues:
        if issue.get("id") == issue_id:
            issue['status'] = new_status
            redis.set('issues', json.dumps(issues))
            add_log_entry(current_user['email'], f"Issue {issue_id} status updated to '{new_status}'")
            return jsonify({"message": "Issue status updated successfully"})
    return jsonify({"error": "Issue not found"}), 404

@app.route('/api/logs', methods=['GET', 'DELETE'])
@token_required
def handle_logs(current_user):
    if request.method == 'GET':
        logs_json = redis.get('logs')
        return jsonify(json.loads(logs_json) if logs_json else [])
    
    if request.method == 'DELETE':
        @role_required(['superuser'])
        def delete(current_user):
            logs_to_delete = set(request.get_json().get('logs', []))
            logs_json = redis.get('logs')
            current_logs = json.loads(logs_json) if logs_json else []
            updated_logs = [log for log in current_logs if log not in logs_to_delete]
            redis.set('logs', json.dumps(updated_logs))
            add_log_entry(current_user['email'], f"Deleted {len(current_logs) - len(updated_logs)} log entries")
            return jsonify({'message': 'Logs deleted successfully'})
        return delete(current_user)


@app.route('/api/admins', methods=['GET', 'POST'])
@token_required
@role_required(['superuser'])
def handle_admins(current_user):
    admins_json = redis.get('admins')
    admins = json.loads(admins_json) if admins_json else []
    if request.method == 'GET':
        return jsonify([{k: v for k, v in a.items() if k != 'password_hash'} for a in admins])
    if request.method == 'POST':
        data = request.get_json()
        if any(a['email'] == data['email'] for a in admins): return jsonify({'message': 'Admin with this email already exists'}), 409
        new_admin = {
            "id": str(uuid.uuid4()), "email": data['email'],
            "password_hash": generate_password_hash(data['password'], method='pbkdf2:sha256'),
            "role": data['role']
        }
        admins.append(new_admin)
        redis.set('admins', json.dumps(admins))
        add_log_entry(current_user['email'], f"Admin Created: {new_admin['email']} with role {new_admin['role']}")
        return jsonify({k: v for k, v in new_admin.items() if k != 'password_hash'}), 201

@app.route('/api/admins/<admin_id>', methods=['PUT', 'DELETE'])
@token_required
@role_required(['superuser'])
def handle_specific_admin(current_user, admin_id):
    admins_json = redis.get('admins')
    admins = json.loads(admins_json) if admins_json else []
    if request.method == 'PUT':
        data = request.get_json()
        for admin in admins:
            if admin.get("id") == admin_id:
                if 'email' in data and data['email']: admin['email'] = data['email']
                if 'role' in data: admin['role'] = data['role']
                if 'password' in data and data['password']: admin['password_hash'] = generate_password_hash(data['password'], method='pbkdf2:sha256')
                redis.set('admins', json.dumps(admins))
                add_log_entry(current_user['email'], f"Admin Updated: {admin['email']}")
                return jsonify({"message": "Admin updated successfully"})
        return jsonify({"error": "Admin not found"}), 404
    if request.method == 'DELETE':
        if current_user['id'] == admin_id: return jsonify({'message': 'Cannot delete yourself'}), 403
        admin_email = next((a['email'] for a in admins if a.get("id") == admin_id), "Unknown")
        updated_admins = [a for a in admins if a.get("id") != admin_id]
        if len(admins) == len(updated_admins): return jsonify({"error": "Admin not found"}), 404
        redis.set('admins', json.dumps(updated_admins))
        add_log_entry(current_user['email'], f"Admin Deleted: {admin_email}")
        return jsonify({"message": "Admin deleted successfully"})

@app.route('/api/settings', methods=['GET', 'PUT'])
@token_required
@role_required(['superuser'])
def handle_settings(current_user):
    if request.method == 'GET':
        settings_json = redis.get('settings')
        settings = json.loads(settings_json) if settings_json else {}
        settings['reminders_paused'] = json.loads(redis.get('reminders_paused') or 'false')
        return jsonify(settings)
    if request.method == 'PUT':
        new_settings = request.get_json()
        if 'reminders_paused' in new_settings:
            redis.set('reminders_paused', json.dumps(new_settings.pop('reminders_paused')))
        redis.set('settings', json.dumps(new_settings))
        add_log_entry(current_user['email'], f"Settings Updated: {', '.join(new_settings.keys())}")
        return jsonify(new_settings)

@app.route('/api/trigger-reminder', methods=['POST'])
def trigger_reminder():
    user_email = "System (Scheduled)"
    if 'x-access-token' in request.headers:
        # This allows manual triggering from the dashboard
        try:
            token = request.headers['x-access-token']
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            user_email = f"Manual ({data['id']})" # Identify manual trigger
        except Exception:
            return jsonify({'message': 'Invalid token for manual trigger'}), 401
    
    if user_email == "System (Scheduled)" and json.loads(redis.get('reminders_paused') or 'false'):
        add_log_entry("System", "Automatic reminder skipped (paused).")
        return jsonify({"message": "Reminders are paused."}), 200

    custom_template = request.get_json().get('message') if request.is_json else None
    flats_json = redis.get('flats')
    flats = json.loads(flats_json) if flats_json else []
    if not flats: return jsonify({"message": "No residents to remind."}), 400
    
    person_on_duty = flats[0]
    settings = json.loads(redis.get('settings') or '{}')
    template = custom_template or settings.get("reminder_template", "Reminder: Bin duty.")
    
    details = []
    contact = person_on_duty.get('contact', {})
    if contact.get('whatsapp'):
        res = send_whatsapp_template_message(contact['whatsapp'], person_on_duty['name'], os.getenv("AISENSY_REMINDER_CAMPAIGN_NAME"), [person_on_duty['name'], settings.get('owner_name'), settings.get('owner_contact_whatsapp')])
        details.append({'recipient': person_on_duty['name'], 'method': 'WhatsApp', 'status': 'Sent', 'content': f"Sent template"})
    if contact.get('sms'):
        res = send_sms_message(contact['sms'], generate_text_message(template, person_on_duty, settings))
        details.append({'recipient': person_on_duty['name'], 'method': 'SMS', 'status': 'Sent', 'content': generate_text_message(template, person_on_duty, settings)})
    if contact.get('email'):
        res = send_email_message(contact['email'], "Bin Duty Reminder", generate_html_message(template, person_on_duty, settings))
        details.append({'recipient': person_on_duty['name'], 'method': 'Email', 'status': 'Sent', 'content': f"Subject: Bin Duty Reminder"})
        
    add_communication_history("Reminder", "Weekly Bin Reminder", details, "Completed")
    
    redis.set('last_reminder_date', date.today().isoformat())
    add_log_entry(user_email, f"Reminder Sent to {person_on_duty['name']}")
    _advance_turn_in_db()
    return jsonify({"message": f"Reminder sent to {person_on_duty['name']}."})


@app.route('/api/announcements', methods=['POST'])
@token_required
@role_required(['superuser', 'editor'])
def send_announcement(current_user):
    data = request.get_json()
    subject, template, ids = data.get('subject'), data.get('message'), data.get('resident_ids')

    flats = json.loads(redis.get('flats') or '[]')
    settings = json.loads(redis.get('settings') or '{}')
    recipients = [f for f in flats if f.get('id') in ids]
    
    details = []
    for resident in recipients:
        contact = resident.get('contact', {})
        if contact.get('whatsapp'):
            res = send_whatsapp_template_message(contact['whatsapp'], resident['name'], os.getenv("AISENSY_ANNOUNCEMENT_CAMPAIGN_NAME"), [subject, resident['name'], template])
            details.append({'recipient': resident['name'], 'method': 'WhatsApp', 'status': 'Sent', 'content': f"Sent template"})
        if contact.get('sms'):
            res = send_sms_message(contact['sms'], generate_text_message(template, resident, settings, subject))
            details.append({'recipient': resident['name'], 'method': 'SMS', 'status': 'Sent', 'content': generate_text_message(template, resident, settings, subject)})
        if contact.get('email'):
            res = send_email_message(contact['email'], subject, generate_html_message(template, resident, settings, subject))
            details.append({'recipient': resident['name'], 'method': 'Email', 'status': 'Sent', 'content': f"Subject: {subject}"})

    add_communication_history("Announcement", subject, details, "Completed")
    add_log_entry(current_user['email'], f"Announcement '{subject}' sent to {len(recipients)} resident(s)")
    return jsonify({"message": f"Announcement sent to {len(recipients)} resident(s)."})

@app.route('/api/set-current-turn/<resident_id>', methods=['POST'])
@token_required
@role_required(['superuser', 'editor'])
def set_current_turn(current_user, resident_id):
    flats = json.loads(redis.get('flats') or '[]')
    resident_to_move = next((r for r in flats if r.get("id") == resident_id), None)
    if not resident_to_move: return jsonify({"error": "Resident not found"}), 404
    new_order = [resident_to_move] + [r for r in flats if r.get("id") != resident_id]
    redis.set('flats', json.dumps(new_order))
    add_log_entry(current_user['email'], f"Duty Turn Set to {resident_to_move['name']}")
    return jsonify({"message": f"Current turn set to {resident_to_move['name']}."})

@app.route('/api/skip-turn', methods=['POST'])
@token_required
@role_required(['superuser', 'editor'])
def skip_turn(current_user):
    flats = json.loads(redis.get('flats') or '[]')
    if not flats: return jsonify({"message": "No residents to skip."}), 400
    skipped_person_name = flats[0]['name']
    _advance_turn_in_db()
    add_log_entry(current_user['email'], f"Duty Turn Skipped for {skipped_person_name}")
    return jsonify({"message": "Turn skipped successfully."})

@app.route('/api/advance-turn', methods=['POST'])
@token_required
@role_required(['superuser', 'editor'])
def advance_turn(current_user):
    _advance_turn_in_db()
    add_log_entry(current_user['email'], "Duty turn manually advanced.")
    return jsonify({"message": "Turn advanced successfully."})

@app.route('/api/history', methods=['GET', 'DELETE'])
@token_required
@role_required(['superuser', 'editor'])
def handle_history(current_user):
    if request.method == 'GET':
        history_json = redis.get('communication_history')
        return jsonify(json.loads(history_json) if history_json else [])
    if request.method == 'DELETE':
        ids_to_delete = set(request.get_json().get('ids', []))
        history_json = redis.get('communication_history')
        history = json.loads(history_json) if history_json else []
        updated_history = [item for item in history if item.get('id') not in ids_to_delete]
        redis.set('communication_history', json.dumps(updated_history))
        add_log_entry(current_user['email'], f"Deleted {len(history) - len(updated_history)} history item(s)")
        return jsonify({'message': 'History items deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)

    
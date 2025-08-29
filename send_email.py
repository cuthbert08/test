import os
import resend

def send_email_message(to_email, subject, html_body):
    """
    Sends an email using the Resend service.
    """
    api_key = os.environ.get("RESEND_API_KEY")
    from_email = os.environ.get("RESEND_FROM_EMAIL")

    if not api_key or not from_email:
        print("ERROR: Resend API Key or From Email is not configured in environment variables.")
        return False

    resend.api_key = api_key

    try:
        response = resend.Emails.send({
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html_body,
        })
        print(f"Email sent successfully to {to_email}, ID: {response['id']}")
        return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False

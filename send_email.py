import os
import resend

def send_email_message(to_email, subject, html_body):
    """
    Sends an email using the Resend service.
    """
    api_key = os.environ.get("RESEND_API_KEY")
    from_email = os.environ.get("RESEND_FROM_EMAIL")

    if not api_key:
        print("MOCK EMAIL (missing RESEND_API_KEY): Email not sent.")
        return False
    if not from_email:
        print("MOCK EMAIL (missing RESEND_FROM_EMAIL): Email not sent.")
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
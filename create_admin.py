# create_admin.py

import os
import json
import uuid
from upstash_redis import Redis
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_admin():
    """
    A command-line script to securely add a new admin user to the Redis database.
    """
    print("--- Create a new Admin User ---")

    # --- Get User Input ---
    email = input("Enter admin email: ").strip()
    if not email:
        print("Error: Email cannot be empty.")
        return

    password = input("Enter admin password: ").strip()
    if not password:
        print("Error: Password cannot be empty.")
        return
    
    role = input("Enter role (superuser, editor, viewer) [default: superuser]: ").strip().lower() or 'superuser'
    if role not in ['superuser', 'editor', 'viewer']:
        print(f"Error: Invalid role '{role}'. Please choose 'superuser', 'editor', or 'viewer'.")
        return

    try:
        # --- Connect to Redis ---
        # This automatically uses the environment variables loaded from the .env file
        redis = Redis.from_env()
        print("Successfully connected to Redis.")

        # --- Fetch Existing Admins ---
        admins_json = redis.get('admins')
        admins = json.loads(admins_json) if admins_json else []
        print(f"Found {len(admins)} existing admin(s).")

        # --- Check for Duplicates ---
        if any(admin['email'] == email for admin in admins):
            print(f"Error: An admin with the email '{email}' already exists.")
            return

        # --- Hash Password ---
        # Use the default, secure hashing method provided by werkzeug
        password_hash = generate_password_hash(password)
        print("Password hashed successfully.")

        # --- Create New Admin ---
        new_admin = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": password_hash,
            "role": role
        }

        # --- Update Database ---
        admins.append(new_admin)
        redis.set('admins', json.dumps(admins))
        print("Updated admin list sent to Redis.")

        print("\n--- Success! ---")
        print(f"Admin user '{email}' with role '{role}' was created successfully.")
        print("You can now log in with these credentials.")

    except Exception as e:
        print(f"\n--- An Error Occurred ---")
        print(f"Could not create admin user due to an error: {e}")
        print("Please check your Redis connection details (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) in your .env file.")

if __name__ == '__main__':
    create_admin()

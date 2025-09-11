from django.core.management.utils import get_random_secret_key
from pathlib import Path

secret_key_file = Path("/app/data/secret_key")

if not secret_key_file.exists():
    with open(secret_key_file, "w") as f:
        f.write(get_random_secret_key())


intial_admin_pw_file = Path("/app/data/admin_pw")

if intial_admin_pw_file.exists():
    print("initial admin password already set")
else:
    admin_password = None
    while not admin_password:
        admin_password = input("Enter an initial password for the admin account:")
        if admin_password:
            with open(intial_admin_pw_file, "w") as f:
                f.write(admin_password)
            print("Initial admin password saved")
        else:
            print("No admin password provided")

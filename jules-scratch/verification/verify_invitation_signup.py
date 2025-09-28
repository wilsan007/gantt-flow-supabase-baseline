import re
from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    # --- Test Setup ---
    invitation_token = "8249fc0b818dcb6efd0e22415ce05cc2dcfc93439a0325553674a556"
    base_url = "http://127.0.0.1:8080"
    signup_url = f"{base_url}/signup/tenant-owner?token={invitation_token}"

    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Capture console logs for debugging
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

    try:
        print(f"Navigating to signup page: {signup_url}")
        page.goto(signup_url)

        # Wait for the loading to complete
        print("Waiting for token validation to complete...")
        welcome_header = page.get_by_role("heading", name="Welcome to the Platform!")
        expect(welcome_header).to_be_visible(timeout=10000)
        print("Token validation complete. Form is visible.")

        # --- DEBUGGING: Add a small delay and verbose logging ---
        time.sleep(1) # Add a 1-second delay to ensure state is settled

        # --- 1. Validate Invitation Details ---
        print("Locating input fields...")
        email_input = page.locator("#email")
        fullname_input = page.locator("#fullName")

        print("Reading values from input fields...")
        email_value = email_input.input_value()
        fullname_value = fullname_input.input_value()
        print(f"DEBUG: Found Email Value: '{email_value}'")
        print(f"DEBUG: Found Full Name Value: '{fullname_value}'")

        print("Asserting field values and states...")
        expect(email_input).to_be_disabled()
        expect(fullname_input).to_be_disabled()
        expect(email_input).to_have_value("test0099@yahoo.com")
        expect(fullname_input).to_have_value("Med Osmanii")
        print("Validation successful.")

        # --- 2. Fill the Form ---
        print("Filling out the registration form...")
        page.locator("#companyName").fill("Test Corp Inc.")
        page.locator("#password").fill("ValidPassword123!")
        page.locator("#confirmPassword").fill("ValidPassword123!")
        print("Form filled.")

        # --- 3. Submit the Form ---
        print("Submitting the form...")
        page.get_by_role("button", name=re.compile("Complete Signup", re.IGNORECASE)).click()

        # --- 4. Assert Success ---
        print("Waiting for success notification...")
        success_toast = page.locator("text=Your account and company have been created")
        expect(success_toast).to_be_visible(timeout=15000)
        print("Success notification appeared!")

        # --- 5. Screenshot ---
        screenshot_path = "jules-scratch/verification/signup_success.png"
        print(f"Taking screenshot at {screenshot_path}")
        page.screenshot(path=screenshot_path)

    except Exception as e:
        print(f"\n--- TEST FAILED ---")
        print(f"An error occurred during the test: {e}")
        page.screenshot(path="jules-scratch/verification/signup_failure.png")
        # Do not re-raise to allow script to finish gracefully

    finally:
        # --- Teardown ---
        context.close()
        browser.close()
        print("\nBrowser closed.")

with sync_playwright() as playwright:
    run(playwright)
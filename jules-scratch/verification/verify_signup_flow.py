from playwright.sync_api import sync_playwright, expect
import subprocess
import json

# --- Dynamically create a test invitation ---
def create_test_invitation():
    print("Creating a new test invitation...")
    result = subprocess.run(['node', 'jules-scratch/verification/create_test_invitation.js'], capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Failed to create test invitation: {result.stderr}")

    invitation_data = json.loads(result.stdout)
    if not invitation_data.get('success'):
        raise Exception(f"Invitation script failed: {invitation_data.get('error')}")

    print(f"Successfully created invitation for: {invitation_data['email']}")
    return invitation_data

# --- Test Configuration ---
COMPANY_NAME = "Test Company Inc."
PASSWORD = "SecurePassword123!"
BASE_URL = "http://127.0.0.1:8081"

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    try:
        # 0. Get fresh test data
        invitation_data = create_test_invitation()
        INVITATION_TOKEN = invitation_data['token']

        # 1. Navigate to the signup page
        signup_url = f"{BASE_URL}/signup/tenant-owner?token={INVITATION_TOKEN}"
        print(f"Navigating to: {signup_url}")
        page.goto(signup_url)

        # 2. Fill out the form
        print("Waiting for the form to be ready...")
        company_name_input = page.get_by_label("Nom de l'entreprise *")
        expect(company_name_input).to_be_visible(timeout=10000)

        print("Form is ready. Filling it out...")
        company_name_input.fill(COMPANY_NAME)
        page.locator('#password').fill(PASSWORD)
        page.locator('#confirmPassword').fill(PASSWORD)

        # 3. Submit the form
        print("Submitting the form...")
        page.get_by_role("button", name="Enregistrer mon entreprise").click()

        # 4. Wait for redirection to the dashboard
        print("Waiting for redirection to the dashboard...")
        dashboard_heading = page.get_by_role("heading", name="Tableau de Bord")
        expect(dashboard_heading).to_be_visible(timeout=20000) # Increased timeout for backend processing

        print("Successfully redirected to the dashboard.")

        # 5. Take a screenshot for final verification
        page.screenshot(path="jules-scratch/verification/dashboard_after_signup.png")
        print("Screenshot of the dashboard taken successfully.")

    except Exception as e:
        print(f"An error occurred during Playwright execution: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
        # Re-raise the exception to fail the test run
        raise e

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the login page
        page.goto("http://127.0.0.1:8080/")

        # Take a screenshot of the initial state
        page.screenshot(path="jules-scratch/verification/initial_login_page.png")
        print("Screenshot of the initial login page taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
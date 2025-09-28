from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the login page
        page.goto("http://127.0.0.1:8080/")

        # Wait for the loading message to disappear and the login form to be ready
        login_button = page.get_by_role("button", name="Se connecter")
        expect(login_button).to_be_visible(timeout=10000)

        # Now that the page is loaded, assert the form elements are visible
        expect(page.get_by_placeholder("admin@example.com")).to_be_visible()
        expect(page.get_by_placeholder("Mot de passe")).to_be_visible()
        expect(login_button).to_be_visible()

        # Take a screenshot of the login page
        page.screenshot(path="jules-scratch/verification/login_page.png")
        print("Screenshot of the login page taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        # Print the page's HTML to help with debugging
        print("\nPage HTML:\n")
        print(page.content())
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
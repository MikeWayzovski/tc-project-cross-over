# Trimble Sand Box (Workspace Manager)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react)
![Trimble Modus](https://img.shields.io/badge/Trimble-Modus_UI-005F9E.svg)

**Trimble Sand Box** is a custom, powerful extension built for Trimble Connect. It serves as a comprehensive workspace manager, allowing project administrators to easily oversee multiple projects, provision users, and audit corporate groups across different global server regions.

The application can run as a standalone web app using Trimble ID OAuth2, or seamlessly embedded inside Trimble Connect Web utilizing the official Trimble Connect Workspace API.

## ✨ Key Features

* **🌍 Multi-Region Project Overview:** Fetch, search, and filter Trimble Connect projects across all global servers (Europe, Asia, North America, Australia).
* **👥 Advanced User Provisioning:** Invite new users to projects in bulk, automatically assign standard roles, and automatically provision missing groups.
* **🏢 Corporate Group Auditing:** Map out and visualize group structures and user memberships across hundreds of projects simultaneously.
* **📊 CSV Export:** Export live group and user data to a CSV file for compliance, billing, or auditing purposes.
* **⚙️ Customizable Settings:** Toggle Dark Mode, configure default onboarding behaviors, choose CSV separators (for Excel compatibility), and manage internal system logs.
* **🔌 Seamless Integration:** Features a responsive, native-feeling UI built with the Trimble Modus framework, perfectly embedding into the Trimble Connect left-panel menu.

## 🚀 How to Install (Embedded Extension)

To use this application as an integrated tool inside Trimble Connect, you need to register it using the Extension Manifest URL.

1. Open **Trimble Connect for Web** and navigate to any of your projects.
2. In the left menu panel, go to **Settings** > **Extensions**.
3. Click on the button to add a new extension.
4. Paste the following **Extension Manifest URL**:
   ```text
   https://modus-sandbox.vercel.app/manifest.json
Click Add or Submit.

Ensure the toggle switch next to "Trimble Sand Box" is set to ON.

Refresh the page. You will now see the application in the left navigation panel (look for the graduation cap icon).

💻 Standalone Usage
If you prefer to run the application outside of the Trimble Connect iframe, simply visit the application URL directly:
👉 https://modus-sandbox.vercel.app

Note: When running standalone, you will be prompted to log in using your Trimble ID credentials.

🛠 Tech Stack
Frontend: React.js + Vite

UI Framework: Trimble Modus UI (Bootstrap)

Authentication: @trimble-oss/trimble-id-react

API Integration: trimble-connect-project-workspace-api

Hosting: Vercel

Developed as a robust sandbox and management tool for Trimble Connect workflows.
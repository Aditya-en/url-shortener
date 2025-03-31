# Advanced URL Shortener Frontend

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwind%20css-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Shadcn UI](https://img.shields.io/badge/shadcn/ui-black?style=for-the-badge&logo=vercel&logoColor=white)

A modern, feature-rich frontend application for shortening URLs, built with React, TypeScript, Vite, Tailwind CSS, and Shadcn UI. It provides a clean interface for creating shortened links with optional features like custom aliases, password protection, and expiration dates.

**(Optional: Add a screenshot or GIF of the app here)**
<!-- ![App Screenshot](link/to/your/screenshot.png) -->

## ✨ Features

*   **URL Shortening:** Quickly shorten long URLs.
*   **Custom Aliases:** Choose your own custom short ID (if available).
*   **Password Protection:** Secure your links with a password.
*   **Link Expiration:** Set an expiration period for your shortened links (e.g., 1 day, 7 days, 30 days).
*   **Dashboard:** View and manage your created URLs (mock data used in this version - requires backend integration for real data).
    *   Display Original URL, Short URL, Creation Date, Expiration Date, Click Count (mocked), Password Status.
    *   Copy Short URL to clipboard.
    *   Direct link to visit the short URL.
    *   Delete functionality (mocked).
    *   Search/Filter URLs.
*   **Redirect Handling:** Handles redirection for short URLs, including prompting for passwords if required.
*   **Theming:** Supports Light, Dark, and System themes via toggle.
*   **Responsive Design:** Works seamlessly across different screen sizes.
*   **Toast Notifications:** Provides user feedback for actions like copying, shortening, and errors.
*   **Typed Codebase:** Built with TypeScript for enhanced reliability and developer experience.

## 🚀 Tech Stack

*   **Framework:** React 18+
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Routing:** React Router DOM v6
*   **UI Components:** Shadcn UI
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks (`useState`, `useEffect`, `useContext`)
*   **Icons:** Lucide React
*   **Linting/Formatting:** ESLint / Prettier (Assumed - configure as needed)
*   **Backend:** Requires a compatible backend API (not included in this repository) to handle URL storage, redirection logic, password verification, etc.

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm or yarn (or pnpm)
*   A running instance of the compatible backend API service.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Environment Variables

This project requires a backend API URL to function correctly.

1.  Create a `.env` file in the root of the project.
2.  Add the following environment variable, pointing to your running backend API:

    ```env
    # .env
    VITE_API_URL=http://localhost:8000 # Replace with your actual backend API URL
    ```

    *Note: Vite requires environment variables exposed to the client to be prefixed with `VITE_`.*

## ධ Running the Application

### Development Mode

To start the application: -

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

# BeautyBook - Setup Guide

This guide provides instructions on how to set up, run, and deploy the BeautyBook project.

## 1. Pushing to GitHub (If you haven't already)

If you've been working on this project locally and now want to push it to a new GitHub repository:

1.  **Create a new repository on GitHub:**
    *   Go to [GitHub](https://github.com) and create a new repository (e.g., `care-booking-factory`).
    *   Do **not** initialize it with a README, .gitignore, or license if you already have these files locally.

2.  **Link your local repository to the GitHub remote:**
    Open your terminal in the project's root directory (`/Users/ibrahimalmotairi/projects/booking-platform`) and run:
    ```bash
    git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
    # Example: git remote add origin https://github.com/abusaleh34/care-booking-factory.git
    ```
    If you get an error that `origin` already exists, you can either remove it first (`git remote remove origin`) or use a different name.

3.  **Verify the new remote:**
    ```bash
    git remote -v
    ```
    You should see your new repository URL listed for fetch and push.

4.  **Push your `main` branch to GitHub:**
    ```bash
    git push -u origin main
    ```
    If your main branch is named differently (e.g., `master`), use that name instead.

## 2. Running the Project Locally

To run the BeautyBook project on your local machine:

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <YOUR_GITHUB_REPOSITORY_URL>
    cd <repository-name> 
    # Example: git clone https://github.com/abusaleh34/care-booking-factory.git
    # cd care-booking-factory
    ```

2.  **Navigate to the project directory:**
    If you already have the project, ensure you are in the root directory:
    ```bash
    cd /Users/ibrahimalmotairi/projects/booking-platform 
    # Or the path where you cloned/created the project
    ```

3.  **Install dependencies:**
    This project uses `npm`. Run the following command to install all necessary packages:
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:3000`. The Mock Service Worker (MSW) is automatically enabled in development mode to provide mock API responses.

5.  **Open the application:**
    Open your web browser and navigate to `http://localhost:3000`.

## 3. Deployment Options

Next.js applications can be deployed to various platforms. Here are some popular choices:

*   **Vercel:** The creators of Next.js offer seamless deployment, optimized for Next.js features. Highly recommended for ease of use and performance.
*   **Netlify:** Another popular platform for deploying modern web applications, with good support for Next.js.
*   **AWS Amplify:** A comprehensive solution from Amazon Web Services for building and deploying full-stack applications.
*   **Docker:** You can containerize your Next.js application using Docker and deploy it to any cloud provider that supports Docker containers (e.g., AWS ECS, Google Cloud Run, Azure Container Instances).
*   **Node.js Server:** You can build the project (`npm run build`) and run it on a traditional Node.js server (`npm run start`).

When deploying, MSW will not be active by default in production builds, so you'll need to connect to a real backend API.

## 4. Environment Variables

Environment variables are used to configure your application without hardcoding values.

1.  **Create a `.env.local` file:**
    In the root of your project, create a file named `.env.local`. This file is ignored by Git and is used for local development environment variables.

2.  **Add environment variables:**
    Add any necessary environment variables to this file in the format `VARIABLE_NAME=value`. For example:
    ```env
    # .env.local

    # Example: If you had a real API backend
    # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

    # For now, most configuration is handled by MSW in development.
    # If specific keys are needed for third-party services (e.g., map APIs), add them here.
    NEXT_PUBLIC_APP_NAME="BeautyBook"
    ```
    `NEXT_PUBLIC_` prefixed variables are exposed to the browser. Variables without the prefix are only available on the server-side.

3.  **Production Environment Variables:**
    When deploying, you will need to configure these environment variables on your hosting platform. Refer to your chosen platform's documentation for instructions.

## 5. Next Steps for Development

The project has a solid foundation. Here are some areas to focus on for continued development:

1.  **Complete Customer Booking Flow:**
    *   Implement date and time selection components for service booking.
    *   Develop the booking confirmation UI and mock checkout process.
    *   Integrate the booking creation with MSW or a real backend.

2.  **Enhance Service Provider Portal:**
    *   **Service Management:** Implement CRUD (Create, Read, Update, Delete) operations for services offered by providers.
    *   **Calendar View:** Integrate a calendar component to display and manage provider bookings and availability.
    *   **Profile Setup:** Allow providers to fully set up and edit their profiles (bio, images, working hours, services offered).
    *   **Earnings Page:** Develop a detailed earnings and statistics page.

3.  **Build Remaining Customer Pages:**
    *   **My Bookings:** Allow customers to view and manage their past and upcoming bookings.
    *   **Favorites:** Implement the wishlist/favorites feature.
    *   **User Profile/Settings:** Allow customers to update their profile information and preferences.

4.  **UI/UX Refinements:**
    *   **Responsiveness:** Conduct thorough testing across various devices (mobile, tablet, desktop) and refine layouts.
    *   **Empty States:** Implement user-friendly empty states for lists, search results, etc.
    *   **Transitions & Animations:** Add subtle animations and transitions for a smoother user experience.
    *   **Loading States:** Ensure all data-fetching operations have clear loading indicators (skeletons, spinners).

5.  **Accessibility (a11y):**
    *   Perform an accessibility audit (color contrast, keyboard navigation, ARIA roles, semantic HTML).
    *   Address any accessibility issues to ensure the platform is usable by everyone.

6.  **Testing:**
    *   Implement unit tests for components and utility functions (e.g., using Vitest or Jest with React Testing Library).
    *   Consider end-to-end tests for critical user flows (e.g., using Playwright or Cypress).

7.  **Optional Enhancements (Phase 6):**
    *   Implement a notification system.
    *   Integrate a maps API for provider geolocation.

Refer to the `PROJECT_STATUS.md` and the original project plan for a more detailed breakdown of features and phases.
Happy coding!

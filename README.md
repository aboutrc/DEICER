# DEICER

## Introduction

DEICER is a web application designed to empower individuals by providing accessible information about their legal rights and offering AI-driven assistance. It aims to help immigrants, individuals in vulnerable situations, or anyone wanting to understand their rights better, especially in interactions with authorities like ICE. DEICER was developed in response to the need for accessible legal information and support for those navigating complex legal landscapes.

## Core Features

-   **Know Your Rights:** Access comprehensive information on legal rights, sourced from our Supabase `rights_sections` database. This information is available in multiple languages and is particularly relevant during encounters with authorities like ICE or police stops.
-   **Tía Lupe - AI Assistant:** Interact with our AI-powered chatbot, Tía Lupe, designed to answer your legal and immigration-related questions. Tía Lupe utilizes technology from ElevenLabs for voice interactions, supports multiple languages, and draws information from reputable sources like LULAC and ACLU.
-   **Interactive Map:** Explore an interactive map to view relevant locations, such as community resources, legal aid offices, or potential checkpoints.
-   **Red Card / Protect Feature:** Quickly access essential rights information or emergency contacts and actions during critical situations, similar to a physical "red card."
-   **Alert System:** Stay informed with our in-app alert system, which can provide important notifications and updates to users.
-   **User Accounts:** Create and manage your user profile by signing up and logging in to the application.
-   **Multilingual Support:** DEICER is available in multiple languages, including English, Spanish, Chinese, Hindi, and Arabic, ensuring accessibility for a diverse user base.
-   **Donation System:** Support the continued development and maintenance of DEICER through our integrated donation system.

## Technology Stack

DEICER is built using the following primary technologies:

-   **Frontend:**
    -   React
    -   TypeScript
    -   Vite (build tool)
    -   Tailwind CSS (styling)
-   **Backend & Database:**
    -   Supabase
-   **AI & Voice:**
    -   ElevenLabs API (for Tía Lupe's voice)
-   **Linting & Formatting:**
    -   ESLint (code linting)
    -   Prettier (code formatting)

## Getting Started

To start using DEICER, simply open your web browser and navigate to the following URL:

`[Link to DEICER Application]Your_Application_URL_Here` (Note: This URL will be updated once the application is deployed.)

Once you access the application, you can explore the various features such as "Know Your Rights," interact with "Tía Lupe - AI Assistant," use the "Interactive Map," and more, directly through your browser. No special installation is required.

## Contributing

We welcome contributions to DEICER! If you're interested in helping improve the application, please follow these guidelines:

### Setting up the Environment

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/deicer.git # Replace with the actual repository URL
    cd deicer
    ```
2.  **Install Dependencies:**
    Make sure you have Node.js and npm installed. Then, run the following command in the project root:
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    DEICER uses API keys for services like Supabase and ElevenLabs. You will need to create a `.env` file in the project root and add your own API keys. Refer to the Supabase and ElevenLabs documentation for instructions on how to obtain these keys.
    Example `.env` structure:
    ```
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
    # Add any other necessary environment variables
    ```
    *(Note: Obtain your own keys for these services.)*

### Running the Project Locally

Once you have set up your environment and configured your API keys, you can start the development server:

```bash
npm run dev
```
This will typically start the application on `http://localhost:5173` (Vite's default) or another port if configured differently.

### Code Style

We use ESLint and Prettier to maintain code consistency and quality. The project is configured with ESLint rules (see `eslint.config.js`). Please ensure your contributions adhere to these standards. It's recommended to integrate ESLint into your code editor for real-time feedback.

### Contribution Process

1.  **Fork the Repository:** Create a fork of the main DEICER repository to your GitHub account.
2.  **Create a New Branch:** For each new feature or bug fix, create a new branch in your forked repository:
    ```bash
    git checkout -b feature/your-feature-name
    ```
    or
    ```bash
    git checkout -b fix/your-bug-fix-name
    ```
3.  **Make Changes:** Implement your changes, ensuring you follow the code style guidelines.
4.  **Commit Your Changes:** Write clear and concise commit messages.
5.  **Push to Your Fork:** Push your changes to your forked repository:
    ```bash
    git push origin feature/your-feature-name
    ```
6.  **Submit a Pull Request:** Open a pull request from your branch to the `main` branch (or the relevant development branch) of the DEICER repository. Provide a clear description of your changes in the pull request.

## License

The licensing for this project is yet to be determined. Please check back later or contact the maintainers for details.

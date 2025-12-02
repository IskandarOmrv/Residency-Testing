# Recidency Testing

Recidency Testing is a web application designed to help users prepare for exams. It allows users to take practice tests with customizable settings, review their results, and track their performance over time. This application is built with modern web technologies to provide a fast, responsive, and user-friendly experience.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (using App Router)
-   **UI Library**: [React](https://react.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
-   **Drag and Drop**: [React DnD](https://react-dnd.github.io/react-dnd/about)

## Features

-   **Customizable Tests**: Users can configure the number of questions and set a time limit for their practice tests.
-   **Interactive Test Interface**: A clean and intuitive interface for taking tests, with progress tracking and question navigation.
-   **Detailed Results**: After completing a test, users can view a detailed results page with their score, time taken, and a breakdown of correct, incorrect, and unanswered questions.
-   **Question Review**: Users can review each question from the test, their selected answer, the correct answer, and an explanation (if available).
-   **Test History**: The app stores test results in the browser's local storage, allowing users to track their progress over time on the History page.
-   **Session Persistence**: If a user accidentally closes the test tab, their progress is saved and can be resumed.
-   **Confirmation on Exit**: The app prompts users for confirmation before leaving an active test to prevent accidental loss of progress.

## Project Structure

The project follows a standard Next.js App Router structure:

```
/
├── src/
│   ├── app/
│   │   ├── (pages)/
│   │   │   ├── history/page.tsx   # Test history page
│   │   │   ├── results/[testId]/page.tsx # Individual test result page
│   │   │   ├── test/page.tsx        # The main test-taking page
│   │   │   └── page.tsx             # Home page for test configuration
│   │   ├── globals.css          # Global styles and Tailwind directives
│   │   ├── icon.tsx             # Application favicon
│   │   └── layout.tsx           # Root layout for the application
│   ├── components/
│   │   ├── ui/                  # Reusable UI components from ShadCN
│   │   └── Header.tsx           # Application header component
│   ├── data/
│   │   └── questions.json       # The source of all test questions
│   ├── hooks/
│   │   ├── use-mobile.tsx       # Hook to detect mobile devices
│   │   └── use-toast.ts         # Hook for showing toast notifications
│   └── lib/
│       ├── types.ts             # TypeScript type definitions
│       └── utils.ts             # Utility functions
├── public/                    # Static assets
├── package.json               # Project dependencies and scripts
└── tailwind.config.ts         # Tailwind CSS configuration
```

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/IskandarOmrv/Residency-Testing
    ```
2.  Navigate to the project directory:
    ```bash
    cd Residency-Testing
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

To run the application in development mode, execute the following command:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.


### Question Data

All questions for the practice tests are stored in `src/data/questions.json`. You can easily add, remove, or modify questions by editing this file. Each question object has the following structure:

```json
{
  "id": "string",
  "questionText": "string",
  "options": ["string"],
  "correctAnswerIndex": "number",
  "explanation": "string (optional)"
}
```

### State Management

The application primarily uses React's built-in state management (`useState`, `useEffect`, `useContext`).

-   **Test Session**: The state of an active test (questions, answers, current index, timer) is stored in the browser's `localStorage`. This allows the session to be restored if the user navigates away and comes back.
-   **Test History**: All completed test results are saved as an array in `localStorage` under the key `testprep-history`.

### Routing

The application uses the Next.js App Router for navigation:

-   `/`: The home page where users can start a new test.
-   `/test`: The page where the test is conducted. It reads configuration from URL query parameters.
-   `/results/[testId]`: Displays the results for a specific test, identified by its unique ID.
-   `/history`: Shows a list of all past test results.

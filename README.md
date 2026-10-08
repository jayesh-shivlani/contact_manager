# Contact Manager

A Flask web application for managing contacts with a MySQL database.

## Requirements

- Python 3.9+
- MySQL

## Setup

1. Create a MySQL database named `contact_manager`.
2. Install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Update the MySQL connection settings in the application scripts if needed.
4. Initialize or migrate the database:

   ```bash
   python setup_db.py
   ```

5. Start the web application:

   ```bash
   python app_web.py
   ```

The application is then available at `http://localhost:5000`.

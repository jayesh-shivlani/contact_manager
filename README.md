# Contact Manager

A Flask web application for managing contacts with a MySQL database.

## Requirements

- Python 3.9+
- MySQL

## Setup

1. Start MySQL, then install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Initialize the complete database schema:

   ```bash
   python setup_db.py
   ```

   If you already created the database using an older version of `setup_db.py`, run
   the migration once before starting the application:

   ```bash
   python migrate.py
   ```

3. Start the web application:

   ```bash
   python app_web.py
   ```

The application is then available at `http://localhost:5000`.

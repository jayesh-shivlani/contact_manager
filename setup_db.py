import mysql.connector
from mysql.connector import Error

def create_database_and_table():
    connection = None
    try:
        # Connect to MySQL server (default XAMPP credentials)
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password=''
        )
        if connection.is_connected():
            print("Successfully connected to MySQL Server!")
            cursor = connection.cursor()
            
            # Create Database
            cursor.execute("CREATE DATABASE IF NOT EXISTS contact_manager")
            print("Database 'contact_manager' ready.")
            
            # Select Database
            cursor.execute("USE contact_manager")
            
            # Create Table
            create_table_query = """
            CREATE TABLE IF NOT EXISTS contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(255)
            )
            """
            cursor.execute(create_table_query)
            print("Table 'contacts' ready.")
            
    except Error as e:
        print(f"Error: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    create_database_and_table()

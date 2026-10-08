import mysql.connector
from mysql.connector import Error

def migrate():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='contact_manager'
        )
        if connection.is_connected():
            cursor = connection.cursor()
            
            try:
                cursor.execute("ALTER TABLE contacts ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE")
                print("Added is_favorite column.")
            except Error as e:
                print(f"Column is_favorite might already exist: {e}")
                
            try:
                cursor.execute("ALTER TABLE contacts ADD COLUMN last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                print("Added last_modified column.")
            except Error as e:
                print(f"Column last_modified might already exist: {e}")
                
            cursor.close()
            connection.close()
    except Error as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    migrate()

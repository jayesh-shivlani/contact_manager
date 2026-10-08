import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='contact_manager'
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def create_contact(name, phone, email):
    connection = get_connection()
    if connection:
        try:
            cursor = connection.cursor()
            query = "INSERT INTO contacts (name, phone, email) VALUES (%s, %s, %s)"
            values = (name, phone, email)
            cursor.execute(query, values)
            connection.commit()
            print(f"Success! Added contact: {name}")
        except Error as e:
            print(f"Failed to insert record: {e}")
        finally:
            cursor.close()
            connection.close()

def view_contacts():
    connection = get_connection()
    if connection:
        try:
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM contacts")
            records = cursor.fetchall()
            print("\n--- Contact List ---")
            if not records:
                print("No contacts found.")
            for row in records:
                print(f"ID: {row[0]} | Name: {row[1]} | Phone: {row[2]} | Email: {row[3]}")
            print("--------------------\n")
        except Error as e:
            print(f"Failed to read records: {e}")
        finally:
            cursor.close()
            connection.close()

def update_contact(contact_id, new_name, new_phone, new_email):
    connection = get_connection()
    if connection:
        try:
            cursor = connection.cursor()
            query = "UPDATE contacts SET name=%s, phone=%s, email=%s WHERE id=%s"
            values = (new_name, new_phone, new_email, contact_id)
            cursor.execute(query, values)
            connection.commit()
            if cursor.rowcount > 0:
                print(f"Success! Updated contact ID {contact_id}")
            else:
                print(f"Contact ID {contact_id} not found.")
        except Error as e:
            print(f"Failed to update record: {e}")
        finally:
            cursor.close()
            connection.close()

def delete_contact(contact_id):
    connection = get_connection()
    if connection:
        try:
            cursor = connection.cursor()
            query = "DELETE FROM contacts WHERE id=%s"
            cursor.execute(query, (contact_id,))
            connection.commit()
            if cursor.rowcount > 0:
                print(f"Success! Deleted contact ID {contact_id}")
            else:
                print(f"Contact ID {contact_id} not found.")
        except Error as e:
            print(f"Failed to delete record: {e}")
        finally:
            cursor.close()
            connection.close()

def main():
    while True:
        print("\n=== Contact Manager ===")
        print("1. Add New Contact")
        print("2. View All Contacts")
        print("3. Update a Contact")
        print("4. Delete a Contact")
        print("5. Exit")
        
        choice = input("Enter your choice (1-5): ")
        
        if choice == '1':
            name = input("Enter Name: ")
            phone = input("Enter Phone: ")
            email = input("Enter Email: ")
            create_contact(name, phone, email)
        elif choice == '2':
            view_contacts()
        elif choice == '3':
            contact_id = input("Enter ID of contact to update: ")
            if contact_id.isdigit():
                name = input("Enter New Name: ")
                phone = input("Enter New Phone: ")
                email = input("Enter New Email: ")
                update_contact(int(contact_id), name, phone, email)
            else:
                print("Invalid ID format. Please enter a number.")
        elif choice == '4':
            contact_id = input("Enter ID of contact to delete: ")
            if contact_id.isdigit():
                delete_contact(int(contact_id))
            else:
                print("Invalid ID format. Please enter a number.")
        elif choice == '5':
            print("Exiting Contact Manager. Goodbye!")
            break
        else:
            print("Invalid choice, please select 1-5.")

if __name__ == '__main__':
    main()

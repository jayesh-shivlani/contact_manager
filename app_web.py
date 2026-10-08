from flask import Flask, request, jsonify, render_template, Response
import mysql.connector
from mysql.connector import Error
import csv
import io

app = Flask(__name__)

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    connection = get_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM contacts ORDER BY is_favorite DESC, last_modified DESC")
        records = cursor.fetchall()
        # Convert datetime objects to string for JSON serialization
        for r in records:
            if r.get('last_modified'):
                r['last_modified'] = r['last_modified'].isoformat()
        return jsonify(records)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    email = data.get('email')
    is_favorite = data.get('is_favorite', False)
    
    if not name or not phone:
        return jsonify({"error": "Name and phone are required"}), 400

    connection = get_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = connection.cursor()
        query = "INSERT INTO contacts (name, phone, email, is_favorite) VALUES (%s, %s, %s, %s)"
        values = (name, phone, email, is_favorite)
        cursor.execute(query, values)
        connection.commit()
        return jsonify({"message": "Contact added successfully", "id": cursor.lastrowid}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/contacts/<int:contact_id>', methods=['PUT'])
def update_contact(contact_id):
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    email = data.get('email')
    
    # Optional field logic (for toggling favorite without updating all fields)
    if 'is_favorite' in data and not name and not phone:
        is_favorite = data.get('is_favorite')
        connection = get_connection()
        if not connection:
            return jsonify({"error": "Database connection failed"}), 500
        try:
            cursor = connection.cursor()
            cursor.execute("UPDATE contacts SET is_favorite=%s WHERE id=%s", (is_favorite, contact_id))
            connection.commit()
            return jsonify({"message": "Contact favorite status updated"})
        except Error as e:
            return jsonify({"error": str(e)}), 500
        finally:
            cursor.close()
            connection.close()

    if not name or not phone:
        return jsonify({"error": "Name and phone are required"}), 400

    is_favorite = data.get('is_favorite', False)
    connection = get_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = connection.cursor()
        query = "UPDATE contacts SET name=%s, phone=%s, email=%s, is_favorite=%s WHERE id=%s"
        values = (name, phone, email, is_favorite, contact_id)
        cursor.execute(query, values)
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({"message": "Contact updated successfully"})
        else:
            return jsonify({"error": "Contact not found"}), 404
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    connection = get_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = connection.cursor()
        query = "DELETE FROM contacts WHERE id=%s"
        cursor.execute(query, (contact_id,))
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({"message": "Contact deleted successfully"})
        else:
            return jsonify({"error": "Contact not found"}), 404
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/contacts/export', methods=['GET'])
def export_contacts():
    connection = get_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500
        
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id, name, phone, email, is_favorite, last_modified FROM contacts ORDER BY is_favorite DESC, last_modified DESC")
        records = cursor.fetchall()
        
        output = io.StringIO()
        writer = csv.writer(output)
        # Header row with all fields
        writer.writerow(['ID', 'Name', 'Phone', 'Email', 'Favorite', 'Last Modified'])
        
        for r in records:
            # Format is_favorite as readable Yes/No
            favorite = 'Yes' if r['is_favorite'] else 'No'
            # Format last_modified as a readable datetime string
            last_mod = r['last_modified'].strftime('%d %b %Y, %I:%M %p') if r['last_modified'] else 'N/A'
            # Keep phone numbers as text in Excel so leading zeroes are preserved
            # and long numbers are not displayed in scientific notation.
            phone = str(r['phone'] or '').replace('"', '""')
            phone_for_csv = f'="{phone}"'
            writer.writerow([
                r['id'],
                r['name'],
                phone_for_csv,
                r['email'] or '',
                favorite,
                last_mod
            ])
            
        output.seek(0)
        # Add UTF-8 BOM so Excel opens it correctly without encoding issues
        csv_content = '\ufeff' + output.getvalue()
        return Response(
            csv_content,
            mimetype="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment;filename=contacts.csv"}
        )
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)

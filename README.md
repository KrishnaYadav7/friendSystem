Backend Setup (backends folder)
Create a .env file in the backends folder:

bash
Copy code

MONGOOSE_DB=your_mongo_db_url_here

PORT=your_port_number_here

JWT_SECRET=your_secret_key_here

Install dependencies and run the backend:


In the terminal, run the following commands:

Copy code

cd backends

npm install


npm run dev

This will start the backend server, using the PORT specified in the .env file, and connect to the MongoDB database using the MONGOOSE_DB variable.

Ignore .env in Git:

Make sure you add your .env file to .gitignore so sensitive information like your database URL and secret key are not exposed:


Install dependencies and run the frontend:

In the terminal, run:

cd assignment

npm install

npm start


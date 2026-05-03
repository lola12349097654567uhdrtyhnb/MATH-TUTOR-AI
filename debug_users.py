import os
import pymongo
from dotenv import load_dotenv

load_dotenv('frontend/.env.local')
load_dotenv('frontend/.env')

uri = os.environ.get("MONGODB_URI")
if not uri:
    print("No MongoDB URI found")
    exit()

client = pymongo.MongoClient(uri)

print("==== SCANNING DBs ====")
for db_name in client.list_database_names():
    db = client[db_name]
    if "users" in db.list_collection_names():
        print(f"Found users in {db_name}")
        for user in db["users"].find():
            print(f"User: '{user.get('username')}', Pass: '{user.get('password_hash')}', Role: '{user.get('role')}'")
        print("========")



## Features
- **Add a mission** (`POST /api/mission`)
- **Find the most isolated country** (`GET /api/countries-by-isolation`)
- **Find the closest mission to a location** (`POST /api/find-closest`)
- **Database auto-creation with sample data**
- **Runs with Docker for easy deployment**

## Getting Started
###1 Clone the repository**
```sh
git clone https://github.com/your-repo/api_mission.git
cd api_mission
```

###2 Configure environment variables**
Create a `.env` file in the root directory:
```
PORT=5000
DB_HOST=db
DB_NAME=mi6_mission
DB_USER=root
DB_PASS=root
GOOGLE_MAPS_API_KEY=AIzaSyC3dGf_g6MdW_zIw8qA1ygRhPoGjHkp9Fw

אולי זה לא יעבוד לך כי הגבלתי את זה רק לאיי פי שלי 

###3 Run with Docker**
```sh
docker-compose up --build
```
 `http://localhost:5000`


##API Endpoints
### **1️⃣ Add a Mission**
- **Endpoint:** `POST /api/mission`
- **Request Body:**
```json
{
  "agent": "007",
  "country": "Brazil",
  "address": "Avenida Vieira Souto 168 Ipanema, Rio de Janeiro",
  "date": "1995-12-17T21:45:17Z"
}
```
- **Response:**
```json
{
  "message": "Mission added successfully",
  "mission": { ... }
}
```

### **2️⃣ Get the Most Isolated Country**
- **Endpoint:** `GET /api/countries-by-isolation`
- **Response:**
```json
{
  "country": "Morocco",
  "isolationDegree": 3
}
```

### **3️⃣ Find the Closest Mission**
- **Endpoint:** `POST /api/find-closest`
- **Request Body:**
```json
{
  "targetLocation": "Paris, France"
}

- **Response:**
```json
{
  "closestMission": { ... }
}


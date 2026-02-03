import React, { useState } from "react";
import { db } from "../firebase"; // make sure firebase.js is set up
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const UserForm = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !age) {
      alert("Please fill out all fields!");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "users"), {
        name,
        age: Number(age),
        timestamp: serverTimestamp()
      });
      alert(`User added with ID: ${docRef.id}`);
      setName("");
      setAge("");
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add a User</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Age: </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
        <button style={{ marginTop: "10px" }} type="submit">Submit</button>
      </form>
    </div>
  );
};

export default UserForm;

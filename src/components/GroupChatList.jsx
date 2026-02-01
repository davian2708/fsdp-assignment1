import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";

export default function GroupChatList() {
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("currentUser");

  useEffect(() => {
    if (!userEmail) return;

    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", userEmail)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroupChats(groups);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching group chats:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userEmail]);

  return (
    <div className="agent-section">
      <h3>Group Chats</h3>

      <div className="agent-list">
        {loading ? (
          <p style={{ color: "#6b7280" }}>Loading group chats...</p>
        ) : groupChats.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No group chats yet.</p>
        ) : (
          groupChats.map((group) => (
            <div
              key={group.id}
              className="agent-row clickable"
              onClick={() => navigate(`/group-chat/${group.id}`)}
            >
              <span>{group.name}</span>
              <span style={{ color: "#6b7280" }}>
                {group.members?.length ?? 0} members
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

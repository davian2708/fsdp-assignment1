import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import "../styles/inviteInbox.css";
import { FiMail } from "react-icons/fi";

export default function InviteInbox() {
  const userEmail = localStorage.getItem("currentUser");
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (!userEmail) return;

    const q = query(
      collection(db, "groupInvites"),
      where("toEmail", "==", userEmail),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setInvites(data);
    });

    return () => unsub();
  }, [userEmail]);

  const inviteCount = invites.length;
  const badgeText = useMemo(() => {
    if (inviteCount <= 0) return "";
    if (inviteCount > 99) return "99+";
    return String(inviteCount);
  }, [inviteCount]);

  const acceptInvite = async (invite) => {
    try {
      await updateDoc(doc(db, "groupChats", invite.groupId), {
        members: arrayUnion(userEmail),
      });

      await updateDoc(doc(db, "groupInvites", invite.id), {
        status: "accepted",
      });
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  const declineInvite = async (inviteId) => {
    try {
      await deleteDoc(doc(db, "groupInvites", inviteId));
    } catch (err) {
      console.error("Error declining invite:", err);
    }
  };

  return (
    <div className="invite-inbox">
      <div className="invite-header">
        <div className="invite-title-row">
          <div className="invite-icon-wrap" aria-label="Invites">
            <FiMail size={18} />

            {/* 🔴 notification badge */}
            {inviteCount > 0 && (
              <span className="invite-badge" aria-label={`${inviteCount} invites`}>
                {badgeText}
              </span>
            )}
          </div>

          <h4 className="invite-title">Group Invites</h4>
        </div>
      </div>

      {invites.length === 0 && (
        <p className="invite-empty">No pending invites</p>
      )}

      {invites.map((invite) => (
        <div key={invite.id} className="invite-card">
          <div className="invite-info">
            <strong className="invite-group">{invite.groupName}</strong>
            <span className="invite-from">
              Invited by {invite.invitedBy || "Unknown"}
            </span>
          </div>

          <div className="invite-actions">
            <button
              className="invite-btn accept"
              onClick={() => acceptInvite(invite)}
            >
              Accept
            </button>

            <button
              className="invite-btn decline"
              onClick={() => declineInvite(invite.id)}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

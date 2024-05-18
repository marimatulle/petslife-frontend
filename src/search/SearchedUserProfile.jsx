import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { database, auth } from "../firebase";
import Topbar from "../bars/Topbar";

const SearchedUserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userDocRef = doc(database, "RegularUsers", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUser(userDocSnap.data());
      } else {
        const userDocRef = doc(database, "Veterinarians", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser(userDocSnap.data());
        }
      }

      const currentUserDocRef = doc(
        database,
        "RegularUsers",
        auth.currentUser.uid
      );
      const currentUserDocSnap = await getDoc(currentUserDocRef);
      if (currentUserDocSnap.exists()) {
        setCurrentUser(currentUserDocSnap.data());
      } else {
        const currentUserDocRef = doc(
          database,
          "Veterinarians",
          auth.currentUser.uid
        );
        const currentUserDocSnap = await getDoc(currentUserDocRef);
        if (currentUserDocSnap.exists()) {
          setCurrentUser(currentUserDocSnap.data());
        }
      }
    };

    fetchUser();
  }, [userId]);

  const sendFriendRequest = async () => {
    if (
      (user?.crmv && currentUser?.crmv) ||
      (!user?.crmv && !currentUser?.crmv)
    ) {
      return;
    }

    const senderId = auth.currentUser.uid;
    const friendRequestDocRef = doc(
      database,
      "FriendRequests",
      `${senderId}_${userId}`
    );

    const friendRequestDocSnap = await getDoc(friendRequestDocRef);
    if (!friendRequestDocSnap.exists()) {
      await setDoc(friendRequestDocRef, {
        senderId,
        receiverId: userId,
        status: "pending",
      });
      setFriendshipStatus("pending");
    }
  };

  const unfriend = async () => {
    const senderId = auth.currentUser.uid;
    const friendRequestDocRef = doc(
      database,
      "FriendRequests",
      `${senderId}_${userId}`
    );

    await updateDoc(friendRequestDocRef, {
      status: "rejected",
    });
    setFriendshipStatus(null);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Topbar location="/userprofile/:userId" />
      <p>{user?.username}</p>
      <p>{user?.name}</p>
      {friendshipStatus === "pending" ? (
        <button onClick={unfriend}>Cancelar solicitação de amizade</button>
      ) : (
        <button onClick={sendFriendRequest}>
          Enviar solicitação de amizade
        </button>
      )}
    </div>
  );
};

export default SearchedUserProfile;
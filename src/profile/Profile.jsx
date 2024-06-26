import React, { useEffect, useState } from "react";
import Topbar from "../bars/Topbar";
import FriendsModal from "./FriendsModal";
import FriendshipRequestsModal from "./FriendshipRequestsModal";
import { auth, database, storage } from "../firebase";
import {
  getDoc,
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { FaUserCircle, FaPencilAlt } from "react-icons/fa";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showFriendshipRequestsModal, setShowFriendshipRequestsModal] =
    useState(false);
  const [requests, setRequests] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          let docRef = doc(database, "RegularUsers", user.uid);
          let docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser(docSnap.data());
          } else {
            docRef = doc(database, "Veterinarians", user.uid);
            docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUser(docSnap.data());
            }
          }
        }
      });
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      const q = query(
        collection(database, "FriendRequests"),
        where("receiverId", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const requestsPromises = querySnapshot.docs.map(async (document) => {
          const senderId = document.data().senderId;
          const senderDocRef = doc(database, "RegularUsers", senderId);
          const senderDocSnap = await getDoc(senderDocRef);
          if (senderDocSnap.exists()) {
            return {
              id: document.id,
              sender: senderDocSnap.data(),
              ...document.data(),
            };
          } else {
            const senderDocRef = doc(database, "Veterinarians", senderId);
            const senderDocSnap = await getDoc(senderDocRef);
            if (senderDocSnap.exists()) {
              return {
                id: document.id,
                sender: senderDocSnap.data(),
                ...document.data(),
              };
            }
          }
        });
        const requests = await Promise.all(requestsPromises);
        setRequests(requests);
      });

      return () => unsubscribe();
    }
  }, []);

  const handleEdit = () => {
    setNewName(user.name);
    setNewUsername(user.username);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const userDocRef = doc(
      database,
      user?.crmv ? "Veterinarians" : "RegularUsers",
      auth.currentUser.uid
    );
    await setDoc(
      userDocRef,
      { name: newName, username: newUsername },
      { merge: true }
    );
    setUser((prevUser) => ({
      ...prevUser,
      name: newName,
      username: newUsername,
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleImageUpload = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  useEffect(() => {
    if (selectedImage) {
      setIsLoading(true);
      const uploadTask = uploadBytesResumable(
        ref(storage, `avatars/${auth.currentUser.uid}`),
        selectedImage
      );

      uploadTask.on(
        "state_changed",
        (snapshot) => {},
        (error) => {
          console.error(error);
          setIsLoading(false);
          toast.error("Erro ao carregar imagem", {
            position: "bottom-center",
          });
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUser((prevUser) => ({ ...prevUser, photoURL: downloadURL }));
            setIsLoading(false);
            const userDocRef = doc(
              database,
              user?.crmv ? "Veterinarians" : "RegularUsers",
              auth.currentUser.uid
            );
            setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });
          });
        }
      );
    }
  }, [selectedImage, user?.crmv]);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Topbar location="/profile" />
      <div className="flex justify-center items-center flex-grow">
        <div className="w-full lg:w-3/4 xl:w-1/2 bg-white shadow rounded-lg p-8 m-4 relative">
          {isEditing ? (
            <IoCheckmarkCircle
              onClick={handleSave}
              className="absolute top-4 right-14 m-2 text-green-400 hover:text-green-500 cursor-pointer text-4xl"
            />
          ) : (
            <IoCheckmarkCircle className="absolute top-4 right-14 m-2 text-green-400 hover:text-green-500 cursor-pointer text-4xl opacity-0" />
          )}
          <FaPencilAlt
            size={16}
            onClick={handleEdit}
            className={`absolute top-4 right-4 m-2 text-orange-300 hover:text-orange-400 cursor-pointer ${
              isEditing ? "opacity-0" : ""
            }`}
          />
          <div className="flex justify-center">
            <label
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {isLoading ? (
                <ClipLoader color="#fb923c" loading={isLoading} size={150} />
              ) : user?.photoURL ? (
                <img
                  className="w-48 h-48 rounded-full mx-auto"
                  src={user.photoURL}
                  alt="Avatar do usuário"
                />
              ) : (
                <FaUserCircle className="text-gray-400 w-48 h-48 mx-auto" />
              )}
              {isHovered && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 text-white rounded-full cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-110">
                  Alterar imagem
                </div>
              )}
            </label>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-center mt-3 font-bold text-2xl mb-2">
              {isEditing ? (
                <input
                  className="text-center border-2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              ) : (
                user?.name
              )}
            </p>
            {isEditing ? (
              <input
                className="text-center text-gray-400 text-lg border-2"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            ) : (
              <p className="text-center text-gray-400 text-lg">
                {user?.username}
              </p>
            )}
            <p className="text-center text-gray-400 text-lg">
              {user?.crmv ? ` (CRMV: ${user?.crmv})` : ""}
            </p>
            {isEditing && (
              <IoCloseCircle
                onClick={handleCancel}
                className="absolute top-4 right-4 m-2 text-red-400 hover:text-red-500 cursor-pointer text-4xl"
              />
            )}
          </div>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <button
              onClick={() => setShowFriendsModal(true)}
              className="bg-orange-300 hover:bg-orange-400 text-white font-bold py-2 px-4 rounded-xl active:scale-[.98]
              active:duration-75 transition-all hover:scale-[1.01] ease-in-out"
            >
              Amigos
            </button>
            <button
              onClick={() => setShowFriendshipRequestsModal(true)}
              className="bg-orange-300 hover:bg-orange-400 text-white font-bold py-2 px-4 rounded-xl active:scale-[.98]
              active:duration-75 transition-all hover:scale-[1.01] ease-in-out"
            >
              Solicitações{" "}
              {requests.length > 0
                ? requests.length > 9
                  ? "9+"
                  : requests.length
                : ""}
            </button>
          </div>
        </div>
      </div>
      {showFriendsModal && (
        <FriendsModal onClose={() => setShowFriendsModal(false)} />
      )}
      {showFriendshipRequestsModal && (
        <FriendshipRequestsModal
          onClose={() => setShowFriendshipRequestsModal(false)}
          requests={requests}
        />
      )}
    </div>
  );
};

export default Profile;
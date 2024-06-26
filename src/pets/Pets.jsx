import React, { useEffect, useState } from 'react';
import Topbar from '../bars/Topbar';
import { auth, database, storage } from '../firebase';
import {
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { uploadBytesResumable, getDownloadURL, ref } from 'firebase/storage';
import PetsBarAndButton from '../bars/PetsBarAndButton';
import UpdateCardModal from './UpdateCardModal';
import { toast } from 'react-toastify';
import CardHeader from './CardHeader';
import CardImage from './CardImage';
import CardDescription from '../components/CardDescription';
import CardTemplate from '../components/CardTemplate';

const Pets = () => {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [friendIds, setFriendIds] = useState([]);
  const [loadingCards, setLoadingCards] = useState({});
  const [isHovered, setIsHovered] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [shouldUpdateCards, setShouldUpdateCards] = useState(false);
  const [isVet, setIsVet] = useState(null);

  useEffect(() => {
    if (!shouldUpdateCards) return;

    fetchCards(friendIds).then(() => {
      setShouldUpdateCards(false);
    });
  }, [shouldUpdateCards, friendIds]);

  useEffect(() => {
    const fetchUserType = async () => {
      let vetRef = doc(database, 'Veterinarians', auth.currentUser.uid);
      let vetSnap = await getDoc(vetRef);

      setIsVet(!!vetSnap.exists());
    };

    fetchUserType();
  }, []);

  const fetchCards = async (includedIds) => {
    const cardCollection = collection(database, 'Cards');
    const cardSnapshot = await getDocs(cardCollection);
    const cardList = cardSnapshot.docs
      .map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }))
      .filter((card) => includedIds.includes(card.userUUID))
      .filter((card) =>
        card.animalName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    setCards(cardList);
  };

  useEffect(() => {
    fetchCards(friendIds);
  }, [searchTerm, friendIds]);

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);

        const receivedRequestsQuery = query(
          collection(database, 'FriendRequests'),
          where('receiverId', '==', auth.currentUser.uid),
          where('status', '==', 'accepted')
        );
        const sentRequestsQuery = query(
          collection(database, 'FriendRequests'),
          where('senderId', '==', auth.currentUser.uid),
          where('status', '==', 'accepted')
        );

        const receivedRequestsSnapshot = await getDocs(receivedRequestsQuery);
        const sentRequestsSnapshot = await getDocs(sentRequestsQuery);

        const friends = [
          ...receivedRequestsSnapshot.docs.map((doc) => doc.data().senderId),
          ...sentRequestsSnapshot.docs.map((doc) => doc.data().receiverId),
          auth.currentUser.uid,
        ];

        setFriendIds(friends);

        fetchCards(friends);
      }
    });
  }, []);

  const handleImageUpload = async (e, card) => {
    const selectedImage = e.target.files[0];
    setLoadingCards((prev) => ({ ...prev, [card.id]: true }));
    const uploadTask = uploadBytesResumable(
      ref(storage, `cards/${card.id}`),
      selectedImage
    );

    uploadTask.on(
      'state_changed',
      (snapshot) => {},
      (error) => {
        console.error(error);
        setLoadingCards((prev) => ({ ...prev, [card.id]: false }));
        toast.error('Erro ao carregar imagem', {
          position: 'bottom-center',
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          card.photoURL = downloadURL;
          setLoadingCards((prev) => ({ ...prev, [card.id]: false }));
          const cardDocRef = doc(database, 'Cards', card.id);
          setDoc(cardDocRef, { photoURL: downloadURL }, { merge: true });
        });
      }
    );
  };

  const handleDeleteCard = async (card) => {
    const cardDocRef = doc(database, 'Cards', card.id);
    await deleteDoc(cardDocRef);
    setCards(cards.filter((c) => c.id !== card.id));
    toast.success('Carteira excluída com sucesso!', {
      position: 'top-center',
    });
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const checkOwnsership = (ownerId) => ownerId === user.uid;

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Topbar location="/cards" />
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-1/4">
          <PetsBarAndButton
            setShouldUpdateCards={setShouldUpdateCards}
            updateSearchTerm={setSearchTerm}
            isVet={isVet}
          />
        </div>
        <div className="w-full sm:w-3/4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {cards.map((card) => (
            <CardTemplate
              key={card.id}
              callback={() => handleCardClick(card)}
              card={card}>
              <CardHeader
                isVet={isVet}
                isOwner={checkOwnsership(card.userUUID)}
                card={card}
                handleDeleteCard={handleDeleteCard}
                handleEditCard={handleEditCard}
              />
              <CardImage
                card={card}
                isOwner={checkOwnsership(card.userUUID)}
                handleImageUpload={handleImageUpload}
                setIsHovered={setIsHovered}
                loadingCards={loadingCards}
                isHovered={isHovered}
              />
              <CardDescription
                title={card.animalName}
                list={[
                  { key: 'Espécie', value: card.animalSpecies },
                  { key: 'Raça', value: card.animalBreed },
                  { key: 'Sexo', value: card.animalSex },
                  { key: 'Idade', value: card.animalAge },
                  { key: 'Cor', value: card.animalColor },
                  { key: 'Castrado', value: card.isNeutered },
                  {
                    key: 'Doenças pré-existentes',
                    value: card.preExistingIllnesses,
                  },
                ]}
              />
            </CardTemplate>
          ))}
        </div>
      </div>
      {isModalOpen && (
        <UpdateCardModal
          setShouldUpdateCards={setShouldUpdateCards}
          onClose={() => setIsModalOpen(false)}
          cardId={selectedCard.id}
        />
      )}
    </div>
  );
};

export default Pets;

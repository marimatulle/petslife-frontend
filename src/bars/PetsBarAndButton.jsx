import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { AiOutlinePlus } from 'react-icons/ai';
import CreateCardModal from '../pets/CreateCardModal';

const PetsBarAndButton = ({
  setShouldUpdateCards,
  updateSearchTerm,
  isVet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      updateSearchTerm(searchTerm);
      setShouldUpdateCards(true);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="relative flex items-center justify-between md:justify-start">
      <FaSearch className="absolute top-1/2 left-8 transform -translate-y-1/2 text-gray-500 text-2xl" />
      <input
        className="w-full sm:w-2/3 md:w-2/4 lg:w-2/3 xl:w-2/3 2xl:w-2/3 ml-16 border-2 border-gray-200 rounded-xl p-4 m-5"
        type="text"
        placeholder="Buscar animal..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleSearch}
      />
      <div className="md:ml-auto">
        {!isVet && (
          <button
            onClick={handleOpenModal}
            className="mr-4 bg-orange-300 hover:bg-orange-400 text-white rounded-xl w-12 h-12 flex items-center 
                      justify-center text-2xl font-bold md:w-12 md:h-12 md:text-2xl active:scale-[.98]
                      active:duration-75 transition-all hover:scale-[1.01] ease-in-out">
            <AiOutlinePlus />
          </button>
        )}
      </div>
      {showModal && (
        <CreateCardModal
          setShouldUpdateCards={setShouldUpdateCards}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default PetsBarAndButton;

import React from 'react';
import Contact from './Contact';
import Avatar from '@mui/material/Avatar';

const FavoritesPage = ({ contacts, onCall, onToggleFavorite }) => {
  const favoriteContacts = contacts.filter((contact) => contact.isFavorite);

  return (
    <div className="">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-200 font-sans flex items-center space-x-2">
          <span className="animate-bounce">⭐</span>
          <span>Favorites</span>
        </h2>
        <div className="space-y-3 bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-sm max-h-96 overflow-y-auto">
  {favoriteContacts.length > 0 ? (
    favoriteContacts.map((contact) => (
      <Contact
        key={contact.id}
        contact={contact}
        onCall={onCall}
        onToggleFavorite={onToggleFavorite}
      />
    ))
  ) : (
    <p className="text-base sm:text-lg text-gray-600 font-sans">No favorite contacts yet.</p>
  )}
</div>

      </div>
    </div>
  );
};

export default FavoritesPage;
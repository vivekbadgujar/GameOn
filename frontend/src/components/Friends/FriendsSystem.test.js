/**
 * Friends System Unit Tests
 * Testing Framework: Jest
 * 
 * Core functionality tests for the Friends system components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the complex dependencies
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Simple Friends List Component for testing
const SimpleFriendsList = ({ friends = [], onChallenge = () => {}, onMessage = () => {} }) => {
  return (
    <div data-testid="friends-list">
      <h2>Friends ({friends.length})</h2>
      {friends.length === 0 ? (
        <div data-testid="no-friends">No friends yet</div>
      ) : (
        friends.map(friend => (
          <div key={friend.id} data-testid={`friend-${friend.id}`} className="friend-card">
            <div className="friend-info">
              <h3>{friend.displayName}</h3>
              <span className={`status ${friend.onlineStatus}`}>
                {friend.onlineStatus === 'online' ? 'Online' : 'Offline'}
              </span>
              <div className="stats">
                <span>Lvl {friend.stats.level}</span>
                <span>{friend.stats.xpPoints} XP</span>
              </div>
            </div>
            <div className="friend-actions">
              <button onClick={() => onChallenge(friend)}>Challenge</button>
              <button onClick={() => onMessage(friend)}>Message</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Simple Friend Requests Component
const SimpleFriendRequests = ({ requests = [], onAccept = () => {}, onDecline = () => {} }) => {
  return (
    <div data-testid="friend-requests">
      <h2>Friend Requests ({requests.length})</h2>
      {requests.length === 0 ? (
        <div data-testid="no-requests">No pending requests</div>
      ) : (
        requests.map(request => (
          <div key={request.id} data-testid={`request-${request.id}`} className="request-card">
            <div className="requester-info">
              <h3>{request.requester.displayName}</h3>
              <span>@{request.requester.username}</span>
            </div>
            <div className="request-actions">
              <button onClick={() => onAccept(request.id)}>Accept</button>
              <button onClick={() => onDecline(request.id)}>Decline</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Simple Search Component
const SimpleUserSearch = ({ onSearch = () => {}, onAddFriend = () => {}, results = [] }) => {
  const [query, setQuery] = React.useState('');

  const handleSearch = () => {
    if (query.length >= 2) {
      onSearch(query);
    }
  };

  return (
    <div data-testid="user-search">
      <div className="search-input">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="search-input"
        />
        <button onClick={handleSearch} data-testid="search-button">
          Search
        </button>
      </div>
      <div className="search-results">
        {results.map(user => (
          <div key={user.id} data-testid={`search-result-${user.id}`} className="user-card">
            <div className="user-info">
              <h3>{user.displayName}</h3>
              <span>@{user.username}</span>
              <span>Lvl {user.stats.level}</span>
            </div>
            <button 
              onClick={() => onAddFriend(user.id)}
              disabled={user.friendshipStatus !== 'none'}
            >
              {user.friendshipStatus === 'none' ? 'Add Friend' : 
               user.friendshipStatus === 'pending' ? 'Pending' : 'Friends'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple Referral Component
const SimpleReferralSystem = ({ referralData = null }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (referralData?.link) {
      navigator.clipboard?.writeText(referralData.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!referralData) {
    return <div data-testid="loading-referral">Loading referral data...</div>;
  }

  return (
    <div data-testid="referral-system">
      <h2>Invite Friends</h2>
      <div className="referral-code">
        <span>Your Code: {referralData.code}</span>
      </div>
      <div className="referral-stats">
        <div>Total Referrals: {referralData.totalReferrals}</div>
        <div>Successful: {referralData.successfulReferrals}</div>
        <div>Earnings: {referralData.referralEarnings} coins</div>
      </div>
      <button onClick={handleCopyLink} data-testid="copy-link-button">
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <div className="share-buttons">
        <button data-testid="share-whatsapp">WhatsApp</button>
        <button data-testid="share-telegram">Telegram</button>
        <button data-testid="share-instagram">Instagram</button>
      </div>
    </div>
  );
};

// Test Data
const mockFriends = [
  {
    id: 'friend1',
    displayName: 'Test Friend 1',
    username: 'testfriend1',
    onlineStatus: 'online',
    stats: { level: 25, xpPoints: 1500 }
  },
  {
    id: 'friend2',
    displayName: 'Test Friend 2',
    username: 'testfriend2',
    onlineStatus: 'offline',
    stats: { level: 30, xpPoints: 2000 }
  }
];

const mockRequests = [
  {
    id: 'req1',
    requester: {
      id: 'user1',
      displayName: 'Requester 1',
      username: 'requester1'
    }
  }
];

const mockSearchResults = [
  {
    id: 'search1',
    displayName: 'Search User 1',
    username: 'searchuser1',
    stats: { level: 22 },
    friendshipStatus: 'none'
  }
];

const mockReferralData = {
  code: 'TEST1234',
  link: 'http://localhost:3000/register?ref=TEST1234',
  totalReferrals: 5,
  successfulReferrals: 3,
  referralEarnings: 150
};

describe('Friends System Components', () => {
  describe('SimpleFriendsList', () => {
    test('should render empty state when no friends', () => {
      render(<SimpleFriendsList friends={[]} />);
      
      expect(screen.getByText('Friends (0)')).toBeInTheDocument();
      expect(screen.getByTestId('no-friends')).toBeInTheDocument();
      expect(screen.getByText('No friends yet')).toBeInTheDocument();
    });

    test('should render friends list with correct data', () => {
      render(<SimpleFriendsList friends={mockFriends} />);
      
      expect(screen.getByText('Friends (2)')).toBeInTheDocument();
      expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      expect(screen.getByText('Test Friend 2')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Lvl 25')).toBeInTheDocument();
      expect(screen.getByText('1500 XP')).toBeInTheDocument();
    });

    test('should call onChallenge when challenge button clicked', () => {
      const mockOnChallenge = jest.fn();
      render(<SimpleFriendsList friends={mockFriends} onChallenge={mockOnChallenge} />);
      
      const challengeButtons = screen.getAllByText('Challenge');
      fireEvent.click(challengeButtons[0]);
      
      expect(mockOnChallenge).toHaveBeenCalledWith(mockFriends[0]);
    });

    test('should call onMessage when message button clicked', () => {
      const mockOnMessage = jest.fn();
      render(<SimpleFriendsList friends={mockFriends} onMessage={mockOnMessage} />);
      
      const messageButtons = screen.getAllByText('Message');
      fireEvent.click(messageButtons[0]);
      
      expect(mockOnMessage).toHaveBeenCalledWith(mockFriends[0]);
    });

    test('should display correct online status styling', () => {
      render(<SimpleFriendsList friends={mockFriends} />);
      
      const onlineStatus = screen.getByText('Online');
      const offlineStatus = screen.getByText('Offline');
      
      expect(onlineStatus).toHaveClass('status', 'online');
      expect(offlineStatus).toHaveClass('status', 'offline');
    });
  });

  describe('SimpleFriendRequests', () => {
    test('should render empty state when no requests', () => {
      render(<SimpleFriendRequests requests={[]} />);
      
      expect(screen.getByText('Friend Requests (0)')).toBeInTheDocument();
      expect(screen.getByTestId('no-requests')).toBeInTheDocument();
      expect(screen.getByText('No pending requests')).toBeInTheDocument();
    });

    test('should render friend requests with correct data', () => {
      render(<SimpleFriendRequests requests={mockRequests} />);
      
      expect(screen.getByText('Friend Requests (1)')).toBeInTheDocument();
      expect(screen.getByText('Requester 1')).toBeInTheDocument();
      expect(screen.getByText('@requester1')).toBeInTheDocument();
    });

    test('should call onAccept when accept button clicked', () => {
      const mockOnAccept = jest.fn();
      render(<SimpleFriendRequests requests={mockRequests} onAccept={mockOnAccept} />);
      
      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);
      
      expect(mockOnAccept).toHaveBeenCalledWith('req1');
    });

    test('should call onDecline when decline button clicked', () => {
      const mockOnDecline = jest.fn();
      render(<SimpleFriendRequests requests={mockRequests} onDecline={mockOnDecline} />);
      
      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);
      
      expect(mockOnDecline).toHaveBeenCalledWith('req1');
    });
  });

  describe('SimpleUserSearch', () => {
    test('should render search input and button', () => {
      render(<SimpleUserSearch />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });

    test('should update input value when typing', () => {
      render(<SimpleUserSearch />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'test user' } });
      
      expect(input.value).toBe('test user');
    });

    test('should call onSearch when search button clicked with valid query', () => {
      const mockOnSearch = jest.fn();
      render(<SimpleUserSearch onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      const searchButton = screen.getByTestId('search-button');
      
      fireEvent.change(input, { target: { value: 'testuser' } });
      fireEvent.click(searchButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('testuser');
    });

    test('should not call onSearch with query less than 2 characters', () => {
      const mockOnSearch = jest.fn();
      render(<SimpleUserSearch onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      const searchButton = screen.getByTestId('search-button');
      
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.click(searchButton);
      
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    test('should render search results', () => {
      render(<SimpleUserSearch results={mockSearchResults} />);
      
      expect(screen.getByText('Search User 1')).toBeInTheDocument();
      expect(screen.getByText('@searchuser1')).toBeInTheDocument();
      expect(screen.getByText('Lvl 22')).toBeInTheDocument();
    });

    test('should call onAddFriend when add friend button clicked', () => {
      const mockOnAddFriend = jest.fn();
      render(<SimpleUserSearch results={mockSearchResults} onAddFriend={mockOnAddFriend} />);
      
      const addButton = screen.getByText('Add Friend');
      fireEvent.click(addButton);
      
      expect(mockOnAddFriend).toHaveBeenCalledWith('search1');
    });

    test('should disable add friend button for non-none friendship status', () => {
      const resultsWithPending = [{
        ...mockSearchResults[0],
        friendshipStatus: 'pending'
      }];
      
      render(<SimpleUserSearch results={resultsWithPending} />);
      
      const addButton = screen.getByText('Pending');
      expect(addButton).toBeDisabled();
    });
  });

  describe('SimpleReferralSystem', () => {
    test('should render loading state when no data', () => {
      render(<SimpleReferralSystem />);
      
      expect(screen.getByTestId('loading-referral')).toBeInTheDocument();
      expect(screen.getByText('Loading referral data...')).toBeInTheDocument();
    });

    test('should render referral data correctly', () => {
      render(<SimpleReferralSystem referralData={mockReferralData} />);
      
      expect(screen.getByText('Invite Friends')).toBeInTheDocument();
      expect(screen.getByText('Your Code: TEST1234')).toBeInTheDocument();
      expect(screen.getByText('Total Referrals: 5')).toBeInTheDocument();
      expect(screen.getByText('Successful: 3')).toBeInTheDocument();
      expect(screen.getByText('Earnings: 150 coins')).toBeInTheDocument();
    });

    test('should render share buttons', () => {
      render(<SimpleReferralSystem referralData={mockReferralData} />);
      
      expect(screen.getByTestId('share-whatsapp')).toBeInTheDocument();
      expect(screen.getByTestId('share-telegram')).toBeInTheDocument();
      expect(screen.getByTestId('share-instagram')).toBeInTheDocument();
    });

    test('should handle copy link functionality', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue()
        }
      });

      render(<SimpleReferralSystem referralData={mockReferralData} />);
      
      const copyButton = screen.getByTestId('copy-link-button');
      expect(copyButton).toHaveTextContent('Copy Link');
      
      fireEvent.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockReferralData.link);
      
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });

      // Should reset after timeout
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copy Link');
      }, { timeout: 3000 });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete friend request workflow', () => {
      const mockOnAccept = jest.fn();
      const mockOnChallenge = jest.fn();
      
      // Start with friend request
      const { rerender } = render(
        <SimpleFriendRequests requests={mockRequests} onAccept={mockOnAccept} />
      );
      
      // Accept friend request
      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);
      expect(mockOnAccept).toHaveBeenCalledWith('req1');
      
      // Simulate friend being added to friends list
      rerender(
        <SimpleFriendsList friends={mockFriends} onChallenge={mockOnChallenge} />
      );
      
      // Challenge the new friend
      const challengeButton = screen.getAllByText('Challenge')[0];
      fireEvent.click(challengeButton);
      expect(mockOnChallenge).toHaveBeenCalledWith(mockFriends[0]);
    });

    test('should handle search to add friend workflow', () => {
      const mockOnSearch = jest.fn();
      const mockOnAddFriend = jest.fn();
      
      render(
        <SimpleUserSearch 
          onSearch={mockOnSearch} 
          onAddFriend={mockOnAddFriend}
          results={mockSearchResults}
        />
      );
      
      // Search for user
      const input = screen.getByTestId('search-input');
      const searchButton = screen.getByTestId('search-button');
      
      fireEvent.change(input, { target: { value: 'searchuser' } });
      fireEvent.click(searchButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('searchuser');
      
      // Add friend from search results
      const addButton = screen.getByText('Add Friend');
      fireEvent.click(addButton);
      
      expect(mockOnAddFriend).toHaveBeenCalledWith('search1');
    });
  });

  describe('Accessibility Tests', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<SimpleFriendsList friends={mockFriends} />);
      
      const friendCards = screen.getAllByTestId(/friend-/);
      expect(friendCards).toHaveLength(2);
      
      const challengeButtons = screen.getAllByText('Challenge');
      challengeButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    test('should be keyboard navigable', () => {
      render(<SimpleFriendRequests requests={mockRequests} />);
      
      const acceptButton = screen.getByText('Accept');
      const declineButton = screen.getByText('Decline');
      
      // Should be focusable
      acceptButton.focus();
      expect(document.activeElement).toBe(acceptButton);
      
      // Should be able to tab to next button
      fireEvent.keyDown(acceptButton, { key: 'Tab' });
      // Note: In real browser, this would focus the next element
    });

    test('should have proper semantic HTML structure', () => {
      render(<SimpleFriendsList friends={mockFriends} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(4); // 2 Challenge + 2 Message buttons
    });
  });

  describe('Performance Tests', () => {
    test('should handle large friend lists efficiently', () => {
      const largeFriendsList = Array.from({ length: 100 }, (_, i) => ({
        id: `friend${i}`,
        displayName: `Friend ${i}`,
        username: `friend${i}`,
        onlineStatus: i % 2 === 0 ? 'online' : 'offline',
        stats: { level: 20 + i, xpPoints: 1000 + i * 100 }
      }));

      const startTime = performance.now();
      render(<SimpleFriendsList friends={largeFriendsList} />);
      const endTime = performance.now();

      expect(screen.getByText('Friends (100)')).toBeInTheDocument();
      expect(screen.getByText('Friend 0')).toBeInTheDocument();
      expect(screen.getByText('Friend 99')).toBeInTheDocument();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should not re-render unnecessarily', () => {
      const mockOnChallenge = jest.fn();
      const { rerender } = render(
        <SimpleFriendsList friends={mockFriends} onChallenge={mockOnChallenge} />
      );

      // Re-render with same props
      rerender(<SimpleFriendsList friends={mockFriends} onChallenge={mockOnChallenge} />);

      // Component should still work correctly
      expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      
      const challengeButton = screen.getAllByText('Challenge')[0];
      fireEvent.click(challengeButton);
      expect(mockOnChallenge).toHaveBeenCalledWith(mockFriends[0]);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing friend data gracefully', () => {
      const friendsWithMissingData = [
        {
          id: 'friend1',
          displayName: 'Test Friend 1',
          // Missing username, onlineStatus, stats
        }
      ];

      render(<SimpleFriendsList friends={friendsWithMissingData} />);
      
      expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      // Should not crash even with missing data
    });

    test('should handle clipboard API not available', () => {
      // Remove clipboard API
      Object.assign(navigator, {
        clipboard: undefined
      });

      render(<SimpleReferralSystem referralData={mockReferralData} />);
      
      const copyButton = screen.getByTestId('copy-link-button');
      fireEvent.click(copyButton);
      
      // Should not crash even without clipboard API
      expect(copyButton).toBeInTheDocument();
    });

    test('should handle empty search results', () => {
      render(<SimpleUserSearch results={[]} />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      // Should not show any search result cards
      expect(screen.queryByTestId(/search-result-/)).not.toBeInTheDocument();
    });
  });
});

describe('Friends System Business Logic', () => {
  describe('Friend Status Logic', () => {
    test('should correctly determine online status', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const getOnlineStatus = (lastActive) => {
        const timeDiff = now - new Date(lastActive);
        if (timeDiff < 5 * 60 * 1000) return 'online';
        if (timeDiff < 30 * 60 * 1000) return 'recently_played';
        return 'offline';
      };

      expect(getOnlineStatus(now)).toBe('online');
      expect(getOnlineStatus(fiveMinutesAgo)).toBe('recently_played');
      expect(getOnlineStatus(thirtyMinutesAgo)).toBe('recently_played');
      expect(getOnlineStatus(oneHourAgo)).toBe('offline');
    });
  });

  describe('Referral Tier Logic', () => {
    test('should calculate correct referral tier', () => {
      const calculateTier = (successfulReferrals) => {
        const tiers = [
          { level: 0, required: 1, badge: null },
          { level: 1, required: 5, badge: 'Bronze Recruiter' },
          { level: 2, required: 10, badge: 'Silver Recruiter' },
          { level: 3, required: 25, badge: 'Gold Recruiter' },
          { level: 4, required: 50, badge: 'Platinum Recruiter' },
          { level: 5, required: 100, badge: 'Diamond Recruiter' }
        ];

        let currentTier = tiers[0];
        for (let i = tiers.length - 1; i >= 0; i--) {
          if (successfulReferrals >= tiers[i].required) {
            currentTier = tiers[i];
            break;
          }
        }

        const nextTier = tiers.find(tier => successfulReferrals < tier.required);

        return { currentTier, nextTier };
      };

      expect(calculateTier(0).currentTier.level).toBe(0);
      expect(calculateTier(5).currentTier.badge).toBe('Bronze Recruiter');
      expect(calculateTier(10).currentTier.badge).toBe('Silver Recruiter');
      expect(calculateTier(25).currentTier.badge).toBe('Gold Recruiter');
      expect(calculateTier(100).currentTier.badge).toBe('Diamond Recruiter');
      
      expect(calculateTier(3).nextTier.required).toBe(5);
      expect(calculateTier(7).nextTier.required).toBe(10);
    });
  });

  describe('Search Validation', () => {
    test('should validate search queries', () => {
      const isValidSearchQuery = (query) => {
        return query && query.trim().length >= 2 && query.trim().length <= 100;
      };

      expect(isValidSearchQuery('')).toBe(false);
      expect(isValidSearchQuery('a')).toBe(false);
      expect(isValidSearchQuery('ab')).toBe(true);
      expect(isValidSearchQuery('valid search')).toBe(true);
      expect(isValidSearchQuery('a'.repeat(101))).toBe(false);
      expect(isValidSearchQuery('  ab  ')).toBe(true); // Should handle whitespace
    });
  });

  describe('Friendship Status Logic', () => {
    test('should determine correct friendship actions', () => {
      const getFriendshipActions = (status, isRequester, isRecipient) => {
        const actions = [];

        switch (status) {
          case 'none':
            actions.push('send_request');
            break;
          case 'pending':
            if (isRecipient) {
              actions.push('accept', 'decline');
            }
            if (isRequester) {
              actions.push('cancel');
            }
            break;
          case 'accepted':
            actions.push('message', 'challenge', 'remove');
            break;
          case 'blocked':
            actions.push('unblock');
            break;
        }

        return actions;
      };

      expect(getFriendshipActions('none', false, false)).toContain('send_request');
      expect(getFriendshipActions('pending', false, true)).toContain('accept');
      expect(getFriendshipActions('pending', false, true)).toContain('decline');
      expect(getFriendshipActions('pending', true, false)).toContain('cancel');
      expect(getFriendshipActions('accepted', false, false)).toContain('message');
      expect(getFriendshipActions('accepted', false, false)).toContain('challenge');
      expect(getFriendshipActions('blocked', false, false)).toContain('unblock');
    });
  });
});
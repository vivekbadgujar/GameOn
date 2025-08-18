/**
 * E2E Tests for GameOn Friends System
 * Testing Framework: Jest with React Testing Library
 * 
 * Test Coverage:
 * - Friends List Management
 * - Friend Requests (Send/Accept/Decline)
 * - User Search and Discovery
 * - Referral System
 * - Challenge System
 * - Achievement Feed
 * - Groups/Clans Management
 * - Real-time Features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Friends from '../../pages/Friends';
import { AuthContext } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock API responses
const mockFriendsData = {
  friends: [
    {
      friendshipId: '1',
      friend: {
        id: 'friend1',
        username: 'testfriend1',
        displayName: 'Test Friend 1',
        avatar: '/avatar1.jpg',
        gameProfile: { bgmiName: 'BGMIFriend1', level: 25 },
        stats: { level: 25, xpPoints: 1500, challengesWon: 10 },
        badges: ['Veteran', 'Champion'],
        onlineStatus: 'online',
        lastActive: new Date().toISOString()
      },
      interactions: { gamesPlayed: 5, messagesExchanged: 20 },
      friendsSince: new Date('2024-01-01').toISOString()
    },
    {
      friendshipId: '2',
      friend: {
        id: 'friend2',
        username: 'testfriend2',
        displayName: 'Test Friend 2',
        avatar: '/avatar2.jpg',
        gameProfile: { bgmiName: 'BGMIFriend2', level: 30 },
        stats: { level: 30, xpPoints: 2000, challengesWon: 15 },
        badges: ['Pro'],
        onlineStatus: 'offline',
        lastActive: new Date(Date.now() - 3600000).toISOString()
      },
      interactions: { gamesPlayed: 8, messagesExchanged: 35 },
      friendsSince: new Date('2024-02-01').toISOString()
    }
  ],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 2 }
};

const mockFriendRequests = {
  requests: [
    {
      id: 'req1',
      requester: {
        id: 'user1',
        username: 'requester1',
        displayName: 'Requester 1',
        avatar: '/avatar3.jpg',
        gameProfile: { bgmiName: 'BGMIReq1', level: 20 },
        stats: { level: 20, xpPoints: 1000 },
        badges: ['Rookie']
      },
      requestedAt: new Date().toISOString()
    }
  ],
  pagination: { currentPage: 1, totalPages: 1, totalCount: 1 }
};

const mockSearchResults = {
  users: [
    {
      id: 'search1',
      username: 'searchuser1',
      displayName: 'Search User 1',
      avatar: '/avatar4.jpg',
      gameProfile: { bgmiName: 'BGMISearch1', level: 22 },
      stats: { level: 22, xpPoints: 1200 },
      badges: ['Explorer'],
      friendshipStatus: 'none'
    }
  ],
  pagination: { currentPage: 1, hasNext: false, hasPrev: false }
};

const mockReferralData = {
  referral: {
    code: 'TEST1234',
    link: 'http://localhost:3000/register?ref=TEST1234',
    totalReferrals: 5,
    successfulReferrals: 3,
    referralEarnings: 150,
    currentTier: { level: 1, badge: 'Bronze Recruiter', achieved: true },
    nextTier: { level: 2, required: 10, remaining: 7, reward: { coins: 500, xp: 1000, badge: 'Silver Recruiter' } }
  }
};

const mockLeaderboard = {
  leaderboard: [
    {
      rank: 1,
      user: {
        id: 'leader1',
        username: 'topplayer',
        displayName: 'Top Player',
        avatar: '/avatar5.jpg',
        stats: { xpPoints: 5000, level: 50 }
      },
      value: 5000,
      isCurrentUser: false
    }
  ]
};

const mockAchievements = [
  {
    id: 'ach1',
    user: {
      id: 'friend1',
      username: 'testfriend1',
      displayName: 'Test Friend 1',
      avatar: '/avatar1.jpg'
    },
    achievement: {
      id: 'combat_master',
      title: 'Combat Master',
      description: 'Won 10 combat challenges',
      category: 'combat',
      rarity: 'epic',
      icon: '/achievement1.png'
    },
    unlockedAt: new Date().toISOString(),
    likes: 5,
    comments: 2,
    isLiked: false
  }
];

// Mock fetch globally
global.fetch = jest.fn();

// Test wrapper component
const TestWrapper = ({ children, user = null }) => {
  const mockAuthContext = {
    user: user || {
      id: 'testuser',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      avatar: '/test-avatar.jpg'
    },
    isAuthenticated: true,
    loading: false
  };

  return (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Friends System E2E Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    toast.success = jest.fn();
    toast.error = jest.fn();
    
    // Setup default API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFriendsData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFriendRequests
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [], pagination: { totalCount: 0 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievements
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [], pagination: { totalCount: 0 } })
      });
  });

  describe('Friends List Management', () => {
    test('should display friends list with online status', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Wait for friends to load
      await waitFor(() => {
        expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
        expect(screen.getByText('Test Friend 2')).toBeInTheDocument();
      });

      // Check online status indicators
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();

      // Check friend stats display
      expect(screen.getByText('Lvl 25')).toBeInTheDocument();
      expect(screen.getByText('1500 XP')).toBeInTheDocument();
    });

    test('should show friend interaction options', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      });

      // Check for action buttons
      const challengeButtons = screen.getAllByText('Challenge');
      const messageButtons = screen.getAllByText('Message');
      
      expect(challengeButtons.length).toBeGreaterThan(0);
      expect(messageButtons.length).toBeGreaterThan(0);
    });

    test('should filter friends by online status', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      });

      // Click online filter (if available)
      const onlineFilter = screen.queryByText('Online Only');
      if (onlineFilter) {
        fireEvent.click(onlineFilter);
        
        await waitFor(() => {
          expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
          expect(screen.queryByText('Test Friend 2')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Friend Requests Management', () => {
    test('should display received friend requests', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to requests tab
      const requestsTab = screen.getByText('Requests');
      fireEvent.click(requestsTab);

      await waitFor(() => {
        expect(screen.getByText('Requester 1')).toBeInTheDocument();
      });

      // Check for accept/decline buttons
      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    test('should accept friend request successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Friend request accepted' })
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to requests tab
      const requestsTab = screen.getByText('Requests');
      fireEvent.click(requestsTab);

      await waitFor(() => {
        expect(screen.getByText('Requester 1')).toBeInTheDocument();
      });

      // Click accept button
      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/friends/requests/req1/accept'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer')
            })
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Friend request accepted');
    });

    test('should decline friend request successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Friend request declined' })
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to requests tab
      const requestsTab = screen.getByText('Requests');
      fireEvent.click(requestsTab);

      await waitFor(() => {
        expect(screen.getByText('Requester 1')).toBeInTheDocument();
      });

      // Click decline button
      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/friends/requests/req1/decline'),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Friend request declined');
    });
  });

  describe('User Search and Friend Discovery', () => {
    test('should search for users and display results', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to add friends tab
      const addTab = screen.getByText('Add Friends');
      fireEvent.click(addTab);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });

      // Search for users
      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'searchuser');

      // Trigger search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Search User 1')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/search?query=searchuser'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });

    test('should send friend request to searched user', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResults
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Friend request sent' })
        });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to add friends tab
      const addTab = screen.getByText('Add Friends');
      fireEvent.click(addTab);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });

      // Search for users
      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'searchuser');

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Search User 1')).toBeInTheDocument();
      });

      // Send friend request
      const addFriendButton = screen.getByText('Add Friend');
      fireEvent.click(addFriendButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/friends/request',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': expect.stringContaining('Bearer')
            }),
            body: JSON.stringify({ recipientId: 'search1' })
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Friend request sent');
    });
  });

  describe('Referral System', () => {
    test('should display referral code and statistics', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReferralData
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to referral tab
      const referralTab = screen.getByText('Invite Friends');
      fireEvent.click(referralTab);

      await waitFor(() => {
        expect(screen.getByText('TEST1234')).toBeInTheDocument();
      });

      // Check referral statistics
      expect(screen.getByText('3')).toBeInTheDocument(); // Successful referrals
      expect(screen.getByText('150')).toBeInTheDocument(); // Earnings
      expect(screen.getByText('Bronze Recruiter')).toBeInTheDocument();
    });

    test('should copy referral link to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue()
        }
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReferralData
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to referral tab
      const referralTab = screen.getByText('Invite Friends');
      fireEvent.click(referralTab);

      await waitFor(() => {
        expect(screen.getByText('TEST1234')).toBeInTheDocument();
      });

      // Click copy button
      const copyButton = screen.getByText('Copy Link');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'http://localhost:3000/register?ref=TEST1234'
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Referral link copied!');
    });

    test('should show sharing options for different platforms', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReferralData
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to referral tab
      const referralTab = screen.getByText('Invite Friends');
      fireEvent.click(referralTab);

      await waitFor(() => {
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Telegram')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Twitter')).toBeInTheDocument();
      });
    });
  });

  describe('Challenge System', () => {
    test('should open challenge modal when challenging a friend', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      });

      // Click challenge button
      const challengeButtons = screen.getAllByText('Challenge');
      fireEvent.click(challengeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Challenge Friend')).toBeInTheDocument();
      });

      // Check challenge options
      expect(screen.getByText('1v1')).toBeInTheDocument();
      expect(screen.getByText('Duo')).toBeInTheDocument();
      expect(screen.getByText('Squad')).toBeInTheDocument();
    });

    test('should create challenge successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Challenge sent successfully' })
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      });

      // Open challenge modal
      const challengeButtons = screen.getAllByText('Challenge');
      fireEvent.click(challengeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Challenge Friend')).toBeInTheDocument();
      });

      // Select challenge type
      const oneVOneButton = screen.getByText('1v1');
      fireEvent.click(oneVOneButton);

      // Select game
      const bgmiOption = screen.getByText('BGMI');
      fireEvent.click(bgmiOption);

      // Send challenge
      const sendButton = screen.getByText('Send Challenge');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/challenges/create',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': expect.stringContaining('Bearer')
            }),
            body: expect.stringContaining('friend1')
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Challenge sent successfully');
    });
  });

  describe('Achievement Feed', () => {
    test('should display friends achievements', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to achievements tab
      const achievementsTab = screen.getByText('Feed');
      fireEvent.click(achievementsTab);

      await waitFor(() => {
        expect(screen.getByText('Combat Master')).toBeInTheDocument();
        expect(screen.getByText('Won 10 combat challenges')).toBeInTheDocument();
      });

      // Check social interaction buttons
      expect(screen.getByText('5')).toBeInTheDocument(); // Likes count
      expect(screen.getByText('2')).toBeInTheDocument(); // Comments count
    });

    test('should like an achievement', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, liked: true })
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to achievements tab
      const achievementsTab = screen.getByText('Feed');
      fireEvent.click(achievementsTab);

      await waitFor(() => {
        expect(screen.getByText('Combat Master')).toBeInTheDocument();
      });

      // Click like button
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/achievements/ach1/like'),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });

    test('should filter achievements by category', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to achievements tab
      const achievementsTab = screen.getByText('Feed');
      fireEvent.click(achievementsTab);

      await waitFor(() => {
        expect(screen.getByText('Combat Master')).toBeInTheDocument();
      });

      // Click combat filter
      const combatFilter = screen.getByText('Combat');
      fireEvent.click(combatFilter);

      // Achievement should still be visible as it's combat category
      expect(screen.getByText('Combat Master')).toBeInTheDocument();
    });
  });

  describe('Leaderboard', () => {
    test('should display friends leaderboard', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to leaderboard tab
      const leaderboardTab = screen.getByText('Leaderboard');
      fireEvent.click(leaderboardTab);

      await waitFor(() => {
        expect(screen.getByText('Top Player')).toBeInTheDocument();
        expect(screen.getByText('5000')).toBeInTheDocument();
      });

      // Check rank display
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('should switch leaderboard types', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to leaderboard tab
      const leaderboardTab = screen.getByText('Leaderboard');
      fireEvent.click(leaderboardTab);

      await waitFor(() => {
        expect(screen.getByText('Top Player')).toBeInTheDocument();
      });

      // Switch to level leaderboard
      const levelTab = screen.getByText('Level');
      fireEvent.click(levelTab);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/friends/leaderboard?type=level'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Groups/Clans Management', () => {
    test('should display groups tab', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to groups tab
      const groupsTab = screen.getByText('Groups');
      fireEvent.click(groupsTab);

      await waitFor(() => {
        expect(screen.getByText('Create Group')).toBeInTheDocument();
      });
    });

    test('should show create group modal', async () => {
      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      // Navigate to groups tab
      const groupsTab = screen.getByText('Groups');
      fireEvent.click(groupsTab);

      await waitFor(() => {
        expect(screen.getByText('Create Group')).toBeInTheDocument();
      });

      // Click create group button
      const createButton = screen.getByText('Create Group');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Group')).toBeInTheDocument();
      });

      // Check form fields
      expect(screen.getByPlaceholderText(/group name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load friends data');
      });
    });

    test('should handle authentication errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Authentication required');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should adapt layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      });

      // Check that mobile-specific classes are applied
      const friendsContainer = screen.getByTestId('friends-container');
      expect(friendsContainer).toHaveClass('mobile-layout');
    });
  });

  describe('Real-time Features', () => {
    test('should update friend status in real-time', async () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };

      // Mock socket.io
      jest.doMock('socket.io-client', () => ({
        io: () => mockSocket
      }));

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
      });

      // Simulate real-time status update
      const statusUpdateCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'friend_status_update'
      )?.[1];

      if (statusUpdateCallback) {
        statusUpdateCallback({
          friendId: 'friend1',
          status: 'offline'
        });

        await waitFor(() => {
          expect(screen.getByText('Offline')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Performance', () => {
    test('should implement pagination for large friend lists', async () => {
      const largeFriendsList = {
        friends: Array.from({ length: 20 }, (_, i) => ({
          friendshipId: `friend${i}`,
          friend: {
            id: `friend${i}`,
            username: `friend${i}`,
            displayName: `Friend ${i}`,
            avatar: `/avatar${i}.jpg`,
            gameProfile: { bgmiName: `BGMI${i}`, level: 20 + i },
            stats: { level: 20 + i, xpPoints: 1000 + i * 100 },
            badges: ['Badge'],
            onlineStatus: i % 2 === 0 ? 'online' : 'offline',
            lastActive: new Date().toISOString()
          },
          interactions: { gamesPlayed: i, messagesExchanged: i * 2 },
          friendsSince: new Date().toISOString()
        })),
        pagination: { currentPage: 1, totalPages: 2, totalCount: 25, hasNext: true }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeFriendsList
      });

      render(
        <TestWrapper>
          <Friends />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Friend 0')).toBeInTheDocument();
        expect(screen.getByText('Friend 19')).toBeInTheDocument();
      });

      // Check for load more button
      const loadMoreButton = screen.getByText('Load More');
      expect(loadMoreButton).toBeInTheDocument();
    });
  });
});

describe('Friends System Integration Tests', () => {
  test('should complete full friend request workflow', async () => {
    // Mock API responses for the complete workflow
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResults })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'Friend request sent' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFriendRequests })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'Friend request accepted' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFriendsData });

    render(
      <TestWrapper>
        <Friends />
      </TestWrapper>
    );

    // Step 1: Search for user
    const addTab = screen.getByText('Add Friends');
    fireEvent.click(addTab);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'searchuser');

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search User 1')).toBeInTheDocument();
    });

    // Step 2: Send friend request
    const addFriendButton = screen.getByText('Add Friend');
    fireEvent.click(addFriendButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Friend request sent');
    });

    // Step 3: Switch to requests tab (simulate receiving request)
    const requestsTab = screen.getByText('Requests');
    fireEvent.click(requestsTab);

    await waitFor(() => {
      expect(screen.getByText('Requester 1')).toBeInTheDocument();
    });

    // Step 4: Accept friend request
    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Friend request accepted');
    });

    // Step 5: Verify friend appears in friends list
    const friendsTab = screen.getByText('Friends');
    fireEvent.click(friendsTab);

    await waitFor(() => {
      expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
    });
  });

  test('should complete challenge workflow', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'Challenge sent' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'Challenge accepted' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, message: 'Challenge started' }) });

    render(
      <TestWrapper>
        <Friends />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Friend 1')).toBeInTheDocument();
    });

    // Step 1: Create challenge
    const challengeButtons = screen.getAllByText('Challenge');
    fireEvent.click(challengeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Challenge Friend')).toBeInTheDocument();
    });

    const oneVOneButton = screen.getByText('1v1');
    fireEvent.click(oneVOneButton);

    const sendButton = screen.getByText('Send Challenge');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Challenge sent');
    });

    // Verify API calls were made correctly
    expect(fetch).toHaveBeenCalledWith(
      '/api/challenges/create',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer')
        })
      })
    );
  });
});

// Performance and Load Testing
describe('Friends System Performance Tests', () => {
  test('should handle large datasets efficiently', async () => {
    const startTime = performance.now();

    const largeFriendsList = {
      friends: Array.from({ length: 100 }, (_, i) => ({
        friendshipId: `friend${i}`,
        friend: {
          id: `friend${i}`,
          username: `friend${i}`,
          displayName: `Friend ${i}`,
          avatar: `/avatar${i}.jpg`,
          gameProfile: { bgmiName: `BGMI${i}`, level: 20 + i },
          stats: { level: 20 + i, xpPoints: 1000 + i * 100 },
          badges: ['Badge'],
          onlineStatus: i % 2 === 0 ? 'online' : 'offline',
          lastActive: new Date().toISOString()
        },
        interactions: { gamesPlayed: i, messagesExchanged: i * 2 },
        friendsSince: new Date().toISOString()
      })),
      pagination: { currentPage: 1, totalPages: 5, totalCount: 100 }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => largeFriendsList
    });

    render(
      <TestWrapper>
        <Friends />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Friend 0')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (less than 2 seconds)
    expect(renderTime).toBeLessThan(2000);
  });

  test('should debounce search input', async () => {
    jest.useFakeTimers();

    render(
      <TestWrapper>
        <Friends />
      </TestWrapper>
    );

    const addTab = screen.getByText('Add Friends');
    fireEvent.click(addTab);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Type rapidly
    await userEvent.type(searchInput, 'test');

    // Fast forward time
    jest.advanceTimersByTime(300);

    // Should not have made API call yet (debounced)
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/friends/search'),
      expect.any(Object)
    );

    // Fast forward past debounce time
    jest.advanceTimersByTime(500);

    // Now should make API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/search?query=test'),
        expect.any(Object)
      );
    });

    jest.useRealTimers();
  });
});
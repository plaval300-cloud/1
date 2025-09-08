import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Container, Typography, Paper, Box, Avatar, Link as MuiLink, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const EventCard = ({ event }) => {
    const renderEventDetails = () => {
        switch (event.action_type) {
            case 'published_article':
                return (
                    <Typography variant="body1">
                        published the article:{' '}
                        <MuiLink component={RouterLink} to={`/article/${event.article_slug}`}>
                            {event.article_title}
                        </MuiLink>
                    </Typography>
                );
            case 'created_goal':
                return (
                    <Typography variant="body1">
                        started a new goal:{' '}
                        <MuiLink component={RouterLink} to={`/goal/${event.goal_id}`}>
                            {event.goal_title}
                        </MuiLink>
                        {event.goal_type === 'challenge' && <Chip label="New Challenge!" color="secondary" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                );
            default:
                return null;
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={event.avatar_url} component={RouterLink} to={`/profile/user/${event.user_id}`} />
            <Box>
                <Typography variant="body1">
                    <MuiLink component={RouterLink} to={`/profile/user/${event.user_id}`} sx={{ fontWeight: 'bold' }}>
                        {event.username}
                    </MuiLink>{' '}
                    {renderEventDetails()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {new Date(event.created_at).toLocaleString()}
                </Typography>
            </Box>
        </Paper>
    );
};


const FeedPage = () => {
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const res = await api.get('/feed');
                setFeed(res.data);
            } catch (err) {
                console.error('Failed to fetch feed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, []);

    return (
        <Container maxWidth="md">
            <Typography variant="h4" sx={{ my: 4 }}>Activity Feed</Typography>
            {loading ? (
                <Typography>Loading feed...</Typography>
            ) : (
                feed.map(event => <EventCard key={event.event_id} event={event} />)
            )}
        </Container>
    );
};

export default FeedPage;

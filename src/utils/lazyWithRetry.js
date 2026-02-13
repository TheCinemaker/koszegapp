import React from 'react';

export const lazyWithRetry = (componentImport) =>
    React.lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            const component = await componentImport();
            window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
            return component;
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // Assuming that the user is not on the latest version of the application.
                // Let's refresh the page immediately.
                console.log('Chunk load failed, reloading page to get new version...');
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
                // Return a promise that never resolves so we don't throw before reload
                return new Promise(() => { });
            }

            // The page has already been reloaded
            // Assuming that user is already using the latest version of the application.
            // Let's let the application crash and raise the error.
            throw error;
        }
    });

// pages/rootFoS.js

import getConfig from "next/config";
import {GetStaticProps} from 'next';
import {useEffect} from 'react';
import {useRouter} from 'next/router';

const RootFoS = ({redirectionUrl}) => {
    const router = useRouter();

    // Redirect to the destination URL once component mounts
    useEffect(() => {
        router.replace(redirectionUrl);
    }, []);
    // This component will not be rendered as it redirects directly to the FoS root page
    return null;
}

export const getStaticProps: GetStaticProps = async () => {
    const {publicRuntimeConfig} = getConfig();
    const fosRootId = publicRuntimeConfig.FOS_ROOT_ID;

    // Define the redirection URL with fosRootId included
    const redirectionUrl = `/fields/${encodeURIComponent(fosRootId).split("_")[0]}`;

    // Return the redirection URL as a prop
    return {
        props: {
            redirectionUrl,
        },
        revalidate: false, // Page will be generated once at build time and not regenerated
    };
};

export default RootFoS;
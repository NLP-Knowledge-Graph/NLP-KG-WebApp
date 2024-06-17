import { InferGetServerSidePropsType, type GetServerSideProps } from "next";
import { createSSRHelpers } from "~/server/api/root";
import BookmarkList from "~/components/Bookmarklist";
// import { useRouter } from 'next/router'

export const getServerSideProps = (async (ctx) => {
  const { params } = ctx;
  if (params === undefined || params.id === undefined)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const listid = params.id as string;
  const helper = await createSSRHelpers(ctx);

  try {
    const result = await helper.bookmarklist.getByID.fetch(listid);

    if (result === null)
      return {
        notFound: true,
      };
  } catch (e) { }

  return {
    props: {
      listid,
      trpcState: helper.dehydrate(),
    },
  };
}) satisfies GetServerSideProps<{
  listid: string;
}>;

export default function BookmarkListPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  // const router = useRouter()


  return <BookmarkList {...props} />;
  // return <BookmarkList listid={router.query.id as string} />;

}

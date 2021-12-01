import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import Header from '../../components/Header';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlineUser } from 'react-icons/ai';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce(
    (totalContent, currentContent) => {
      const headingWords = currentContent.heading?.split(' ').length || 0;

      const bodyWords = currentContent.body.reduce((totalBody, currentBody) => {
        const textWords = currentBody.text.split(' ').length;
        return totalBody + textWords;
      }, 0);

      return totalContent + headingWords + bodyWords;
    },
    0
  );

  const timeEstimmed = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>Posts | ProjetoZero</title>
      </Head>
      <Header />
      <section className={styles.imageContainer}>
        <img src={post.data.banner.url} alt="" />
      </section>

      <main className={styles.container}>
        <header className={styles.HeaderContent}>
          <h1>{post.data.title}</h1>
          <div>
            <time>
              <AiOutlineCalendar />
              {post.first_publication_date}
            </time>
            <span>
              <AiOutlineUser />
              {post.data.author}
            </span>
            <span>
              <AiOutlineClockCircle />
              {timeEstimmed} min
            </span>
          </div>
        </header>
        {post.data.content.map(content => (
          <div className={styles.content}>
            <h1>{content.heading}</h1>
            <div 
                className={styles.postContent}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} 
            />
          </div>
        ))}
      </main>
    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], { 
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1
  });
  return {
    paths: postsResponse.results.map((doc) => {
      return { params: { slug: doc.uid }};
    }),
    fallback: true,
  };
}

export const getStaticProps = async ({params}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
        first_publication_date: format(
          new Date(response.last_publication_date),
          "dd LLL yyyy",
          {
            locale: ptBR,
          }
        ),
        data: {
          title: RichText.asText(response.data.title),
          banner: {
            url: response.data.banner.url,
          },
          author: RichText.asText(response.data.author),
          content: response.data.content.map(content => {
            return {
              heading: RichText.asText(content.heading),
              body: [...content.body],
            }
          })
        }
  } 
  
  return {
    props: {
      post
    }
  }
};


import next, { GetStaticProps } from 'next';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import Header from '../components/Header';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { formatDate } from '../utils';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [next_page, setNextPage] = useState<string>(postsPagination.next_page);
  useEffect(() => {
    setPosts(postsPagination.results)
    setNextPage(postsPagination.next_page)
  }, [])

  async function handleLoadingPosts(): Promise<void> {
    fetch(next_page)
    .then(response => {
      return response.json()
    })
    .then(data => {
      const results = data.results.map(post => {
        return {
            uid: post.uid,
            first_publication_date: formatDate(post.first_publication_date),
            data: {
              title: RichText.asText(post.data.title),
              subtitle: RichText.asText(post.data.subtitle),
              author: RichText.asText(post.data.author),
            }
        }
      })
      setPosts([...posts, ...results]);
      setNextPage(data.next_page);
    })  
    
  }

  return (
    <>
      <Head>
        <title>Posts | ProjetoZero</title>
      </Head>
      <Header />

      <main className={styles.container}>
        <div className={styles.posts}>
          { posts?.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a href="#">
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <AiOutlineCalendar />
                    {post.first_publication_date}
                  </time>
                  <span>
                    <AiOutlineUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          )) }
          {next_page && (
            <button type="button" onClick={handleLoadingPosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], { 
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1
  });

  const next_page = postsResponse.next_page;

  const results: Post[] = postsResponse.results.map(post => {
    return {
        uid: post.uid,
        first_publication_date: formatDate(post.first_publication_date),
        data: {
          title: RichText.asText(post.data.title),
          subtitle: RichText.asText(post.data.subtitle),
          author: RichText.asText(post.data.author),
        }
    }
})

  return {
    props: {
      postsPagination: {
        next_page,
        results
      },
    }
  }

};

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';

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
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState(
    postsPagination.results.map(post => ({
      slug: post.uid,
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
      createdAt: post.first_publication_date,
    }))
  );

  function handleLoadMore() {
    fetch(nextPage)
      .then(response => {
        return response.json();
      })
      .then((data: PostPagination) => {
        const newPosts = data.results.map(post => ({
          slug: post.uid,
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
          createdAt: post.first_publication_date,
        }));
        setPosts(prevState => [...prevState, ...newPosts]);
        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <div className={commonStyles.mainWrapper}>
        <div className={styles.container}>
          <header>
            <img src="/logo.svg" alt="logo" />
          </header>
          <div className={styles.posts}>
            {posts &&
              posts.map(post => {
                return (
                  <div key={post.slug} className={styles.post}>
                    <Link href={`/post/${post.slug}`}>
                      <a>
                        <h2>{post.title}</h2>
                        <p>{post.subtitle}</p>
                        <footer>
                          <div>
                            <FiCalendar size={20} />
                            <span>
                              {format(new Date(post.createdAt), 'd MMM yyyy', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <div>
                            <FiUser size={20} />
                            <span>{post.author}</span>
                          </div>
                        </footer>
                      </a>
                    </Link>
                  </div>
                );
              })}
          </div>
          {nextPage && (
            <button
              type="button"
              className={styles.nextPosts}
              onClick={handleLoadMore}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['title', 'subtitle', 'author'],
      pageSize: 5,
    }
  );

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};

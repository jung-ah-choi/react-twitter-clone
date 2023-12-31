import PostBox from 'components/posts/PostBox';
import PostForm from 'components/posts/PostForm';
import AuthContext from 'context/AuthContext';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from 'firebaseApp';
import useTranslation from 'hooks/useTranslation';
import { useCallback, useContext, useEffect, useState } from 'react';

export interface PostProps {
  id: string;
  email: string;
  content: string;
  createdAt: string;
  uid: string;
  profileUrl?: string;
  likes?: string[];
  likeCount?: number;
  comments?: any;
  hashtags?: string[];
  imageUrl?: string;
}

type TabType = 'all' | 'following';

interface UserProps {
  id: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [followingPost, setFollowingPost] = useState<PostProps[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>(['']);
  const { user } = useContext(AuthContext);
  const translation = useTranslation();

  // 실시간 동기화로 user의 팔로잉 id 배열 가져오기
  const getFollowingIds = useCallback(async () => {
    if (user?.uid) {
      const ref = doc(db, 'following', user?.uid);
      onSnapshot(ref, (doc) => {
        setFollowingIds(['']);
        doc
          ?.data()
          ?.users?.map((user: UserProps) =>
            setFollowingIds((prev: string[]) =>
              prev ? [...prev, user?.id] : []
            )
          );
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      let postsRef = collection(db, 'posts');
      let postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      let followingQuery = query(
        postsRef,
        where('uid', 'in', followingIds),
        orderBy('createdAt', 'desc')
      );

      onSnapshot(postsQuery, (snapShot) => {
        let dataObj = snapShot.docs.map((doc) => ({
          ...doc.data(),
          id: doc?.id,
        }));
        setPosts(dataObj as PostProps[]);
      });

      onSnapshot(followingQuery, (snapShot) => {
        let dataObj = snapShot.docs.map((doc) => ({
          ...doc.data(),
          id: doc?.id,
        }));
        setFollowingPost(dataObj as PostProps[]);
      });
    }
  }, [followingIds, user]);

  useEffect(() => {
    if (user?.uid) getFollowingIds();
  }, [getFollowingIds, user?.uid]);

  return (
    <div className='home'>
      <div className='home__top'>
        <div className='home__title'> {translation('MENU_HOME')}</div>
        <div className='home__tabs'>
          <div
            className={`home__tab ${
              activeTab === 'all' && 'home__tab--active'
            }`}
            onClick={() => {
              setActiveTab('all');
            }}
          >
            {translation('TAB_ALL')}
          </div>
          <div
            className={`home__tab ${
              activeTab === 'following' && 'home__tab--active'
            }`}
            onClick={() => {
              setActiveTab('following');
            }}
          >
            {translation('TAB_FOLLOWING')}
          </div>
        </div>
      </div>

      <PostForm />
      {activeTab === 'all' && (
        <div className='post'>
          {posts.length > 0 ? (
            posts?.map((post) => <PostBox post={post} key={post?.id} />)
          ) : (
            <div className='post__no-posts'>
              {translation('NO_POSTS')}
              <div className='post__text'></div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div className='post'>
          {followingPost.length > 0 ? (
            followingPost?.map((post) => <PostBox post={post} key={post?.id} />)
          ) : (
            <div className='post__no-posts'>
              <div className='post__text'>{translation('NO_POSTS')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

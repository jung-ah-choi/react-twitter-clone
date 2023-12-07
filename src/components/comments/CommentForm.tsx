import AuthContext from 'context/AuthContext';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseApp';
import { PostProps } from 'pages/home';
import { useContext, useState } from 'react';
import { toast } from 'react-toastify';

export interface CommentFormProps {
  post: PostProps | null;
}

export default function CommentForm({ post }: CommentFormProps) {
  const [comment, setComment] = useState<string>('');
  const { user } = useContext(AuthContext);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (post && user) {
      try {
        const postRef = doc(db, 'posts', post?.id);
        const commentObj = {
          comment: comment,
          uid: user?.uid,
          email: user?.email,
          createdAt: new Date()?.toLocaleDateString('ko', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };

        await updateDoc(postRef, {
          comments: arrayUnion(commentObj),
        });

        toast.success('댓글이 생성되었습니다.');
        setComment('');
      } catch (error: any) {
        console.log(error);
      }
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {
      target: { name, value },
    } = e;

    if (name === 'comment') {
      setComment(value);
    }
  };

  return (
    <form className='post-form' onSubmit={onSubmit}>
      <textarea
        className='post-form__textarea'
        name='comment'
        id='comment'
        required
        placeholder='What is happening?'
        onChange={onChange}
        value={comment}
      />
      <div className='post-form__submit-area'>
        <div />
        <input
          type='submit'
          value='Comment'
          className='post-form__submit-btn'
          disabled={!comment}
        />
      </div>
    </form>
  );
}

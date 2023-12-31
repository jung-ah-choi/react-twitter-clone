import { useContext, useState } from 'react';
import { FiImage } from 'react-icons/fi';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from 'firebaseApp';
import { toast } from 'react-toastify';
import AuthContext from 'context/AuthContext';

import { v4 as uuidv4 } from 'uuid';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import useTranslation from 'hooks/useTranslation';

export default function PostForm() {
  const [content, setContent] = useState<string>('');
  const [hashtag, setHastag] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user } = useContext(AuthContext);
  const translation = useTranslation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      target: { files },
    } = e;

    const file = files?.[0];

    if (file) {
      const fileReader = new FileReader();
      fileReader?.readAsDataURL(file);

      fileReader.onloadend = (e: ProgressEvent<FileReader>) => {
        const { result } = e.currentTarget as FileReader;
        setImageFile(result as string);
      };
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    const key = `${user?.uid}/${uuidv4()}`;
    const storageRef = ref(storage, key);
    e.preventDefault();

    try {
      // 이미지 업로드
      let imageUrl = '';
      if (imageFile) {
        const data = await uploadString(storageRef, imageFile, 'data_url');
        imageUrl = await getDownloadURL(data?.ref);
      }
      // 업로드된 이미지의 download url 업데이트

      await addDoc(collection(db, 'posts'), {
        content: content,
        createdAt: new Date()?.toLocaleDateString('ko', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        uid: user?.uid,
        email: user?.email,
        hashtags: hashtags,
        imageUrl: imageUrl,
      });
      setContent('');
      setHashtags([]);
      setHastag('');
      setImageFile(null);
      toast.success('게시글을 생성했습니다.');
      setIsSubmitting(false);
    } catch (e: any) {
      console.log(e);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {
      target: { name, value },
    } = e;

    if (name === 'content') {
      setContent(value);
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags?.filter((value) => value !== tag));
  };

  const onChangeHashtag = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHastag(e?.target?.value?.trim());
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && e.currentTarget.value.trim() !== '') {
      // 같은 태그가 있으면 에러 띄우기 아니라면 생성
      if (hashtags?.includes(e.currentTarget.value.trim())) {
        toast.error('이미 입력한 태그가 있습니다.');
      } else {
        setHashtags((prev) =>
          prev?.length > 0 ? [...prev, hashtag] : [hashtag]
        );
        setHastag('');
      }
    }
  };

  const handleDeleteImage = () => {
    setImageFile(null);
  };

  return (
    <form className='post-form' onSubmit={onSubmit}>
      <textarea
        className='post-form__textarea'
        required
        name='content'
        id='content'
        placeholder={translation('POST_PLACEHOLDER')}
        onChange={onChange}
        value={content}
      />
      <div className='post-form__hashtags'>
        <span className='post-form__hastags-outputs'>
          {hashtags?.map((tag, index) => (
            <span
              className='post-form__hashtags-tag'
              key={index}
              onClick={() => removeHashtag(tag)}
            >
              #{tag}
            </span>
          ))}
        </span>
        <input
          className='post-form__input'
          name='hashtag'
          id='hashtag'
          placeholder={translation('POST_HASHTAG')}
          onChange={onChangeHashtag}
          onKeyUp={handleKeyUp}
          value={hashtag}
        />
      </div>
      <div className='post-form__submit-area'>
        <div className='post-form__image-area'>
          <label htmlFor='file-input' className='post-form__file'>
            <FiImage className='post-form__file-icon' />
          </label>
          <input
            type='file'
            id='file-input'
            name='file-input'
            accept='image/*'
            onChange={handleFileUpload}
            className='hidden'
          />
          {imageFile && (
            <div className='post-form__attachment'>
              <img src={imageFile} alt='attachment' width={100} height={100} />
              <button
                className='post-form__clear-btn'
                type='button'
                onClick={handleDeleteImage}
              >
                {translation('BUTTON_DELETE')}
              </button>
            </div>
          )}
        </div>
        <input
          type='submit'
          value={translation('BUTTON_TWEET')}
          className='post-form__submit-btn'
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}

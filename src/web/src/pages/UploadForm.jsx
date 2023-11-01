import { useContext, useRef } from 'react'
import {
  Button, Header, Input, Segment
} from 'semantic-ui-react'
import { toast } from 'react-toastify'
import axios from 'axios'

import { UploadStateContext } from '../common/UploadStateProvider'
import ACCEPTED_UPLOAD_MIME_TYPES from '../common/acceptedUploadMimeTypes'

export default function UploadForm() {
  const {
    isUploading,
    uploadFile,
    // uploadToast,
    setIsUploading,
    setUploadFile,
    // setUploadToast,
  } = useContext(UploadStateContext)
  const uploadToastRef = useRef(null)
  // const [imageFile, setImageFile] = useState(null)

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  function handleUpload(e) {
    e.preventDefault()

    setIsUploading(true)
    uploadToastRef.current = toast('Upload in progress...', {
      // autoClose: false,
      progress: 0,
      type: toast.TYPE.INFO,
    })

    const filePointer = uploadFile

    // eslint-disable-next-line no-use-before-define
    validateFilePromise(filePointer)
      .then((formData) => {
        const url = `//${import.meta.env.VITE_API_HOST || '127.0.0.1'}:${import.meta.env.VITE_API_PORT || 3000}/api/upload`

        return axios.request(
          {
            data: formData,
            method: 'POST',
            onUploadProgress: (prog) => {
              const progress = prog.loaded / prog.total
              toast.update(uploadToastRef.current, { progress })
            },
            url,
          }
        )
      })
      .then(() => {
        toast.update(uploadToastRef.current, {
          autoClose: 5000,
          render: 'Upload complete!',
          type: toast.TYPE.SUCCESS,
        })
        setUploadFile(null)
        // if (uploadFileRef.current) {
        //   uploadFileRef.current.value = null
        // }
      })
      .catch((error) => {
        toast.update(uploadToastRef.current, {
          autoClose: 5000,
          render: `Upload unsuccessful: ${error.message}`,
          type: toast.TYPE.ERROR,
        })
      })
      .finally(() => {
        setIsUploading(false)
      })

    function validateFilePromise(file) {
      return new Promise((resolve, reject) => {
        if (!file) {
          reject(new Error('No file provided.'))
        }

        if (!ACCEPTED_UPLOAD_MIME_TYPES.includes(file.type)) {
          reject(new Error('Invalid file type.'))
        }

        const formData = new FormData()
        formData.append('user-upload', file)
        resolve(formData)
      })
    }
  }

  return (
    <form onSubmit={(e) => handleUpload(e)}>
      <Segment placeholder>
        <Header as='h2' icon>Upload</Header>
        <Input type='file'>
          <input
            accept={ACCEPTED_UPLOAD_MIME_TYPES.join(', ')}
            disabled={isUploading}
            id='upload-picker'
            // multiple
            name='user-upload'
            // onInput={(event) => {
            //   event.preventDefault()
            //   if (uploadFileRef?.current?.files?.[0]?.type?.includes('image')) {
            //     setImageFile(() => uploadFileRef?.current?.files?.[0])
            //   } else {
            //     setImageFile(() => null)
            //   }
            // }}
            onChange={handleFileChange}
            type='file'
          />
        </Input>
        <br />
        <Button
          disabled={isUploading}
          id='upload-button'
          type='submit'
          primary
        >
          Upload
        </Button>
        {/* <Button secondary>Cancel</Button> */}
        {/* {imageFile?.type?.includes('image') && (
          <>
            <br />
            <img src={URL.createObjectURL(imageFile)} alt='' />
          </>
        )} */}
      </Segment>
    </form>
  )
}

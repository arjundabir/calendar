'use client';

import { Dialog, DialogTitle, DialogDescription } from '@/components/dialog';
import { DialogBody, DialogActions } from './dialog';
import { ErrorMessage, Field, FieldGroup, Label } from './fieldset';
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Input } from './input';
import { Button } from './button';
import z from 'zod';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { Avatar } from './avatar';
import { Strong, Text } from './text';

const emailSchema = z.email({ message: 'Invalid email address' });
type emailType = z.infer<typeof emailSchema>;

export default function ShareModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: Dispatch<SetStateAction<boolean>>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [emails, setEmails] = useState<(emailType | Doc<'users'>)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const convex = useConvex();

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (error) {
      setError(null);
      return;
    }

    if ((e.key === ' ' || e.key === 'Enter') && inputRef) {
      const inputValue = inputRef.current?.value.trim();
      if (inputValue) {
        const validation = emailSchema.safeParse(inputValue);
        if (validation.success) {
          const user = await convex.query(api.users.getUser, {
            email: validation.data,
          });
          if (user) {
            setEmails((emails) => [...emails, user]);
            inputRef.current!.value = '';
          } else {
            setError("User doesn't exist.");
            // TODO @arjundabir: resend emails
            // setEmails((emails) => [...emails, validation.data]);
          }
        } else {
          setError(validation.error.issues[0].message);
        }
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Share Calendar</DialogTitle>
      <DialogDescription>Add people to see your calendars.</DialogDescription>
      <DialogBody>
        <FieldGroup>
          <Field>
            <Label>Add Emails</Label>
            <div className="flex flex-col gap-1 my-2">
              {emails?.map((email) => {
                if (typeof email === 'string') {
                  return null;
                  // TODO @arjundabir: implement resend emails
                  // <EmailRow
                  //   key={email}
                  //   email={email}
                  //   handleDelete={() =>
                  //     setEmails((emails) =>
                  //       emails.filter((em) => em !== email)
                  //     )
                  //   }
                  // />
                } else {
                  return (
                    <EmailRow
                      key={email._id}
                      name={email.name}
                      email={email.email}
                      image={email.pictureUrl}
                      handleDelete={() =>
                        setEmails((emails) =>
                          emails.filter(
                            (em) => (em as Doc<'users'>)._id !== email._id
                          )
                        )
                      }
                    />
                  );
                }
              })}
            </div>
            <Input
              ref={inputRef}
              onKeyDown={handleKeyDown}
              type="email"
              name="emails"
              placeholder="Type an email, then press Space or Enter to add it."
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </Field>
        </FieldGroup>
      </DialogBody>
      <DialogActions>
        <Button plain onClick={() => onClose(false)}>
          Cancel
        </Button>
        <Button onClick={() => onClose(false)}>Share</Button>
      </DialogActions>
    </Dialog>
  );
}

function EmailRow({
  name,
  email,
  image,
  handleDelete,
}: {
  name?: string;
  email: string;
  image?: string;
  handleDelete: () => void;
}) {
  return (
    <div className="flex gap-x-2 items-center ">
      {image ? (
        <Avatar square src={image} className="size-10" />
      ) : (
        <div className="rounded-lg size-10 border grid place-content-center select-none">
          ?
        </div>
      )}
      <div className="grow">
        <Strong className="text-sm/5!">
          {name ?? 'Send invite to create account'}
        </Strong>
        <Text className="text-sm/5!">{email}</Text>
      </div>
      <Button plain onClick={handleDelete}>
        <XMarkIcon />
      </Button>
    </div>
  );
}

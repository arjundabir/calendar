'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { type Dispatch, type SetStateAction, useRef, useState } from 'react';
import z from 'zod';
import { Dialog, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { DialogActions, DialogBody } from './ui/dialog';
import { ErrorMessage, Field, FieldGroup, Label } from './ui/fieldset';
import { Input } from './ui/input';
import { Strong, Text } from './ui/text';

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
  const activeCalendar = useQuery(api.calendars.queries.getActiveCalendar);

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
          if (user && inputRef.current) {
            setEmails((emails) => [...emails, user]);
            inputRef.current.value = '';
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

  const shareCalendar = useMutation(api.shares.mutations.shareCalendar);
  async function handleShare() {
    try {
      await shareCalendar({
        calendarId: (activeCalendar as Doc<'calendars'>)._id,
        emails: emails.map((email) => (email as Doc<'users'>)._id),
      });
      setEmails([]);
      onClose(false);
    } catch (error) {
      console.error(error);
      setError('Failed to share calendar');
    }
  }

  const unshareCalendar = useMutation(api.shares.mutations.unshareCalendar);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Share "{activeCalendar?.calendarName}" Calendar</DialogTitle>
      <DialogDescription>Add people to see your calendar.</DialogDescription>
      <DialogBody>
        <FieldGroup>
          {activeCalendar?.sharedWith &&
            activeCalendar.sharedWith.length > 0 && (
              <Field>
                <Label>Shared With</Label>
                <div className="flex flex-col gap-1 mb-2">
                  {activeCalendar.sharedWith.map((user) => {
                    if (!user) return null;

                    return (
                      <EmailRow
                        key={user._id}
                        email={user.email}
                        image={user.pictureUrl}
                        name={user.name}
                        handleDelete={() =>
                          unshareCalendar({
                            calendarId: (activeCalendar as Doc<'calendars'>)
                              ._id,
                            userId: user._id,
                          })
                        }
                      />
                    );
                  })}
                </div>
              </Field>
            )}
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
        <Button onClick={() => handleShare()}>Share</Button>
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

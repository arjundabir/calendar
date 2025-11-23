import { getWebSocTerms } from '@/app/actions';
import { Select } from '@/components/select';
import { Input } from '../input';

export default async function SearchInput() {
  const websocTerms = await getWebSocTerms();
  return (
    <div className="flex gap-1">
      <Select
        name="term"
        defaultValue={websocTerms[0].longName}
        className="max-w-fit"
      >
        <option value="" disabled>
          Select a term
        </option>
        {websocTerms.map((term) => (
          <option key={term.shortName} value={term.longName}>
            {term.shortName}
          </option>
        ))}
      </Select>
      <Input placeholder="Search courses" />
    </div>
  );
}

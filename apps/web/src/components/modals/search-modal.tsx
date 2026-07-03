import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useQueryState } from "nuqs";

export function SearchModal() {
  const [key, setKey] = useQueryState("key");
  return (
    <>
      <CommandInput
        placeholder="Type a command or search..."
        onInput={(e) => {
          const value = e.currentTarget.value;
          if (value === "") {
            setKey(null);
          } else {
            setKey(value);
          }
        }}
        value={key || ""}
        className="w-[90%]"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  );
}

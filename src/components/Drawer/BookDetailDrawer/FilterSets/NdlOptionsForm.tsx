import { useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';

const FormSchema = z.object({
  title: z.string(),
  useCreator: z.boolean(),
  usePublisher: z.boolean(),
});

export type NdlFormOptions = z.infer<typeof FormSchema>;
export type NdlFullOptions = NdlFormOptions & { creator: string; publisher: string };

type Props = {
  defaultValues: NdlFullOptions;
  onChange: (values: NdlFullOptions) => void;
};

export default function NdlOptionsForm({ defaultValues, onChange }: Props) {
  const form = useForm<NdlFormOptions>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    (data: NdlFormOptions) => {
      const newData = { ...defaultValues, ...data };
      form.reset(newData);
      onChange(newData);
    },
    [defaultValues, form, onChange]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-background rounded-xl flex flex-col w-full gap-1 items-stretch"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0 flex-1">
              <FormLabel>タイトル</FormLabel>
              <div className="flex flex-col flex-1">
                <FormControl>
                  <Input placeholder="タイトル" {...field} className="flex-1" />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <div className="flex gap-3 items-end w-full">
          <div className="flex flex-col gap-1 flex-1 pl-4">
            <FormField
              control={form.control}
              name="useCreator"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 flex-1">
                  <div className="flex flex-col">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={checked => field.onChange(checked)} />
                    </FormControl>
                    <FormMessage />
                  </div>
                  <FormLabel>著者を条件に含める</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usePublisher"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 flex-1">
                  <div className="flex flex-col">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={checked => field.onChange(checked)} />
                    </FormControl>
                    <FormMessage />
                  </div>
                  <FormLabel>出版社を条件に含める</FormLabel>
                </FormItem>
              )}
            />
          </div>
          <Button size="sm" type="submit" disabled={!form.formState.isDirty}>
            <RotateCw />
            再読込
          </Button>
        </div>
      </form>
    </Form>
  );
}

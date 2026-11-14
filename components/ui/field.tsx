import type { ComponentProps } from 'react';

type FieldProps = ComponentProps<'div'> & {
  orientation?: 'vertical' | 'horizontal';
};

type FieldErrorProps = ComponentProps<'div'> & {
  errors?: Array<{ message?: string } | undefined>;
};

function Field({ className, orientation = 'vertical', ...props }: FieldProps) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={`group/field flex w-full gap-2 ${
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col'
      } ${className ?? ''}`}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={`grid gap-6 ${className ?? ''}`}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label
      data-slot="field-label"
      className={`group/field-label inline-flex w-fit items-center gap-2 ${className ?? ''}`}
      {...props}
    />
  );
}

function FieldError({ errors, className, ...props }: FieldErrorProps) {
  const messages = errors?.flatMap((error) =>
    error?.message ? [error.message] : [],
  );

  if (!messages?.length) return null;

  return (
    <div
      data-slot="field-error"
      role="alert"
      className={`text-danger text-sm ${className ?? ''}`}
      {...props}
    >
      {messages.map((message, index) => (
        <p key={`${message}-${index}`}>{message}</p>
      ))}
    </div>
  );
}

export { Field, FieldError, FieldGroup, FieldLabel };

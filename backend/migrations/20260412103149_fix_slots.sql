-- +goose Up
-- +goose StatementBegin
alter table slot
    add column discount integer not null default 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table slot
    drop column discount;
-- +goose StatementEnd

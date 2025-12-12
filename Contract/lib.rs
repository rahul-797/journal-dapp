#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("5GEgJnuMG7VgAbt8dU31tqeVzmk1UokxUBc1N8y4u89v");

#[program]
pub mod crud {
    use super::*;
    pub fn create_journal_entry(
        ctx: Context<CreateJournalEntry>,
        title: String,
        content: String,
    ) -> Result<()> {
        let journal_entry = &mut ctx.accounts.journal_entry;
        journal_entry.title = title;
        journal_entry.content = content;
        journal_entry.owner = *ctx.accounts.owner.key;
        Ok(())
    }
    pub fn update_journal_entry(
        ctx: Context<UpdateJournalEntry>,
        _title: String,
        content: String,
    ) -> Result<()> {
        let journal_entry = &mut ctx.accounts.journal_entry;
        journal_entry.content = content;
        Ok(())
    }
    pub fn delete_journal_entry(
        _ctx: Context<DeleteJournalEntry>,
        _title: String,
    ) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateJournalEntry<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + JournalEntry::INIT_SPACE,
        seeds = [b"journal_entry", owner.key().as_ref(), title.as_bytes()],
        bump,
    )]
    pub journal_entry: Account<'info, JournalEntry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct JournalEntry {
    pub owner: Pubkey,
    #[max_len(64)]
    pub title: String,
    #[max_len(256)]
    pub content: String,
}

#[derive(Accounts)]
#[instruction(_title: String)]
pub struct UpdateJournalEntry<'info> {
    #[account(
        mut,
        has_one = owner @ ErrorCode::Unauthorized,
        realloc = 8 + JournalEntry::INIT_SPACE,
        realloc::payer = owner,
        realloc::zero = true,
        seeds = [b"journal_entry", owner.key().as_ref(), _title.as_bytes()],
        bump,
    )]
    pub journal_entry: Account<'info, JournalEntry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}

#[derive(Accounts)]
#[instruction(_title: String)]
pub struct DeleteJournalEntry<'info> {
    #[account(
        mut,
        close = owner,
        has_one = owner @ ErrorCode::Unauthorized,
        seeds = [b"journal_entry", owner.key().as_ref(), _title.as_bytes()],
        bump,
    )]
    pub journal_entry: Account<'info, JournalEntry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
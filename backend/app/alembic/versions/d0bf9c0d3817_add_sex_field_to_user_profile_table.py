"""Add sex field to user profile table.

Revision ID: d0bf9c0d3817
Revises: 3dc3cb88b8fa
Create Date: 2021-03-07 22:08:02.821961

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd0bf9c0d3817'
down_revision = '3dc3cb88b8fa'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('userprofile', sa.Column('sex', sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('userprofile', 'sex')
    # ### end Alembic commands ###

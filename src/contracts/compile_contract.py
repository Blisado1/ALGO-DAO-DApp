from pyteal import *

from dao_contract import Dao_Contract

from proposal_contract import Proposal_Contract

import os

if __name__ == "__main__":

    cwd = os.path.dirname(__file__)

    approval_program_dao = Dao_Contract().approval_program()
    clear_program_dao = Dao_Contract().clear_program()

    approval_program_proposal = Proposal_Contract().approval_program()
    clear_program_proposal = Proposal_Contract().clear_program()

    # Compile approval program for dao
    compiled_approval_dao = compileTeal(
        approval_program_dao, Mode.Application, version=6)
    print(compiled_approval_dao)

    file_name = os.path.join(cwd, "dao_approval.teal")
    with open(file_name, "w") as teal:
        teal.write(compiled_approval_dao)
        teal.close()

    # Compile clear program for dao
    compiled_clear_dao = compileTeal(
        clear_program_dao, Mode.Application, version=6)
    print(compiled_clear_dao)
    file_name = os.path.join(cwd, "dao_clear.teal")
    with open(file_name, "w") as teal:
        teal.write(compiled_clear_dao)
        teal.close()

    # Compile approval program for Proposal
    compiled_approval_proposal = compileTeal(
        approval_program_proposal, Mode.Application, version=6)
    print(compiled_approval_proposal)

    file_name = os.path.join(cwd, "proposal_approval.teal")
    with open(file_name, "w") as teal:
        teal.write(compiled_approval_proposal)
        teal.close()

  # Compile clear program for Proposal
    compiled_clear_proposal = compileTeal(
        clear_program_proposal, Mode.Application, version=6)
    print(compiled_clear_proposal)
    file_name = os.path.join(cwd, "proposal_clear.teal")
    with open(file_name, "w") as teal:
        teal.write(compiled_clear_proposal)
        teal.close()
